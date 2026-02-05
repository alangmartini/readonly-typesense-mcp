import type { Client } from 'typesense';
import type { CollectionSchema } from 'typesense/lib/Typesense/Collection.js';
import { z } from 'zod';
import { handleTypesenseError } from '../utils/errors.js';

/**
 * Review collection schema and documents to suggest improvements
 */
const ReviewCollectionArgsSchema = z.object({
  collection_name: z.string().describe('Name of the collection to review'),
  sample_size: z.number().optional().default(100).describe('Number of documents to sample for analysis'),
});

interface ReviewFinding {
  category: 'schema' | 'indexing' | 'search' | 'performance' | 'data_quality';
  severity: 'info' | 'suggestion' | 'warning' | 'critical';
  field?: string;
  title: string;
  description: string;
  recommendation: string;
}

interface CollectionReview {
  collection_name: string;
  summary: {
    total_documents: number;
    total_fields: number;
    searchable_fields: number;
    facet_fields: number;
    sortable_fields: number;
  };
  findings: ReviewFinding[];
  field_analysis: FieldAnalysis[];
}

interface FieldAnalysis {
  name: string;
  type: string;
  facet: boolean;
  index: boolean;
  optional: boolean;
  sort: boolean;
  infix: boolean;
  usage: {
    populated_count: number;
    empty_count: number;
    unique_values_sample?: number;
    avg_length?: number;
  };
}

function analyzeSchema(schema: CollectionSchema): ReviewFinding[] {
  const findings: ReviewFinding[] = [];
  const fields = schema.fields || [];

  // Check for default_sorting_field
  if (!schema.default_sorting_field) {
    findings.push({
      category: 'search',
      severity: 'suggestion',
      title: 'No default sorting field',
      description: 'The collection has no default_sorting_field configured.',
      recommendation: 'Consider setting a default_sorting_field (e.g., a timestamp or relevance score) to ensure consistent result ordering when no explicit sort is specified.',
    });
  }

  // Check for token separators
  if (!schema.token_separators || schema.token_separators.length === 0) {
    findings.push({
      category: 'search',
      severity: 'info',
      title: 'Default token separators',
      description: 'Using default token separators. Custom separators can improve search for specific data formats.',
      recommendation: 'If your data contains special characters that should split tokens (e.g., hyphens in product codes like "ABC-123"), consider adding custom token_separators.',
    });
  }

  // Analyze individual fields
  for (const field of fields) {
    // Check for non-indexed string fields
    if (field.type === 'string' && field.index === false) {
      findings.push({
        category: 'indexing',
        severity: 'info',
        field: field.name,
        title: 'Non-indexed string field',
        description: `Field "${field.name}" is a string but not indexed.`,
        recommendation: 'This is fine for display-only fields. If you need to search or filter by this field, enable indexing.',
      });
    }

    // Check for facet opportunities on string fields
    if (field.type === 'string' && !field.facet && field.index !== false) {
      findings.push({
        category: 'search',
        severity: 'info',
        field: field.name,
        title: 'Potential facet field',
        description: `String field "${field.name}" is not configured for faceting.`,
        recommendation: 'If this field has categorical data with limited unique values, consider enabling facet:true for filtering UI.',
      });
    }

    // Check for sort opportunities on numeric fields
    if (['int32', 'int64', 'float'].includes(field.type) && !field.sort) {
      findings.push({
        category: 'search',
        severity: 'info',
        field: field.name,
        title: 'Numeric field without sorting',
        description: `Numeric field "${field.name}" does not have sorting enabled.`,
        recommendation: 'If users might want to sort by this field (e.g., price, date, score), enable sort:true.',
      });
    }

    // Check for infix search on short string fields
    if (field.type === 'string' && field.infix && !field.name.includes('id') && !field.name.includes('code')) {
      findings.push({
        category: 'performance',
        severity: 'warning',
        field: field.name,
        title: 'Infix search enabled',
        description: `Field "${field.name}" has infix search enabled which increases index size significantly.`,
        recommendation: 'Only use infix search for fields where substring matching is essential (e.g., product codes, SKUs). Consider prefix search as a lighter alternative.',
      });
    }

    // Check auto fields
    if (field.type === 'auto') {
      findings.push({
        category: 'schema',
        severity: 'warning',
        field: field.name,
        title: 'Auto-detected field type',
        description: `Field "${field.name}" uses auto type detection.`,
        recommendation: 'Explicitly define field types for better performance and predictability. Auto-detection can lead to inconsistent indexing if data varies.',
      });
    }

    // Check for geopoint without proper naming
    if (field.type === 'geopoint' && !field.name.toLowerCase().includes('location') && !field.name.toLowerCase().includes('geo') && !field.name.toLowerCase().includes('coordinates')) {
      findings.push({
        category: 'schema',
        severity: 'info',
        field: field.name,
        title: 'Geopoint field naming',
        description: `Geopoint field "${field.name}" could have a more descriptive name.`,
        recommendation: 'Consider naming geopoint fields with location/geo/coordinates suffix for clarity.',
      });
    }

    // Check for optional on ID-like fields
    if ((field.name === 'id' || field.name.endsWith('_id')) && field.optional) {
      findings.push({
        category: 'data_quality',
        severity: 'warning',
        field: field.name,
        title: 'Optional ID field',
        description: `ID-like field "${field.name}" is marked as optional.`,
        recommendation: 'ID fields should typically be required. Consider whether this field should be mandatory.',
      });
    }
  }

  // Check for missing common field patterns
  const fieldNames = fields.map(f => f.name.toLowerCase());

  if (!fieldNames.some(n => n.includes('created') || n.includes('timestamp') || n.includes('date'))) {
    findings.push({
      category: 'schema',
      severity: 'info',
      title: 'No timestamp field detected',
      description: 'No obvious timestamp/created_at field found.',
      recommendation: 'Consider adding a timestamp field for sorting by recency and time-based filtering.',
    });
  }

  return findings;
}

function analyzeDocuments(schema: CollectionSchema, documents: Record<string, unknown>[]): { findings: ReviewFinding[]; fieldAnalysis: FieldAnalysis[] } {
  const findings: ReviewFinding[] = [];
  const fields = schema.fields || [];
  const fieldAnalysis: FieldAnalysis[] = [];

  if (documents.length === 0) {
    findings.push({
      category: 'data_quality',
      severity: 'warning',
      title: 'Empty collection',
      description: 'The collection contains no documents.',
      recommendation: 'Add documents to fully evaluate the collection configuration.',
    });
    return { findings, fieldAnalysis };
  }

  // Analyze each field's usage in documents
  for (const field of fields) {
    const analysis: FieldAnalysis = {
      name: field.name,
      type: field.type,
      facet: field.facet || false,
      index: field.index !== false,
      optional: field.optional || false,
      sort: field.sort || false,
      infix: field.infix || false,
      usage: {
        populated_count: 0,
        empty_count: 0,
      },
    };

    const values: unknown[] = [];
    let totalLength = 0;
    let lengthCount = 0;

    for (const doc of documents) {
      const value = doc[field.name];

      if (value === undefined || value === null || value === '') {
        analysis.usage.empty_count++;
      } else {
        analysis.usage.populated_count++;
        values.push(value);

        if (typeof value === 'string') {
          totalLength += value.length;
          lengthCount++;
        } else if (Array.isArray(value)) {
          totalLength += value.length;
          lengthCount++;
        }
      }
    }

    // Calculate unique values for categorical analysis (sample)
    if (values.length > 0) {
      const uniqueValues = new Set(values.map(v => JSON.stringify(v)));
      analysis.usage.unique_values_sample = uniqueValues.size;
    }

    if (lengthCount > 0) {
      analysis.usage.avg_length = Math.round(totalLength / lengthCount);
    }

    fieldAnalysis.push(analysis);

    // Generate findings based on usage patterns
    const populationRate = analysis.usage.populated_count / documents.length;
    const uniqueRatio = (analysis.usage.unique_values_sample || 0) / documents.length;

    // Check for mostly empty optional fields
    if (field.optional && populationRate < 0.1 && documents.length >= 10) {
      findings.push({
        category: 'data_quality',
        severity: 'info',
        field: field.name,
        title: 'Rarely populated field',
        description: `Field "${field.name}" is populated in only ${Math.round(populationRate * 100)}% of documents.`,
        recommendation: 'Consider if this field is necessary or if data collection needs improvement.',
      });
    }

    // Check for high-cardinality facet fields
    if (field.facet && uniqueRatio > 0.8 && documents.length >= 10) {
      findings.push({
        category: 'performance',
        severity: 'warning',
        field: field.name,
        title: 'High-cardinality facet',
        description: `Facet field "${field.name}" has ${analysis.usage.unique_values_sample} unique values in ${documents.length} sampled documents (${Math.round(uniqueRatio * 100)}% unique).`,
        recommendation: 'High-cardinality facets can impact performance and provide poor UX. Consider removing facet:true if this field has too many unique values.',
      });
    }

    // Check for low-cardinality non-facet fields
    if (!field.facet && field.type === 'string' && uniqueRatio < 0.1 && documents.length >= 10 && (analysis.usage.unique_values_sample || 0) < 50) {
      findings.push({
        category: 'search',
        severity: 'suggestion',
        field: field.name,
        title: 'Low-cardinality field without faceting',
        description: `Field "${field.name}" has only ${analysis.usage.unique_values_sample} unique values in ${documents.length} documents.`,
        recommendation: 'This looks like categorical data. Consider enabling facet:true for filtering capabilities.',
      });
    }

    // Check for very long string fields
    if (field.type === 'string' && (analysis.usage.avg_length || 0) > 1000) {
      findings.push({
        category: 'performance',
        severity: 'info',
        field: field.name,
        title: 'Long text field',
        description: `Field "${field.name}" has an average length of ${analysis.usage.avg_length} characters.`,
        recommendation: 'For very long text, ensure you\'re using appropriate settings. Consider if full indexing is needed or if a summary field would suffice for search.',
      });
    }

    // Check for required fields that are empty in some documents
    if (!field.optional && analysis.usage.empty_count > 0) {
      findings.push({
        category: 'data_quality',
        severity: 'warning',
        field: field.name,
        title: 'Required field with missing data',
        description: `Required field "${field.name}" is empty in ${analysis.usage.empty_count} of ${documents.length} sampled documents.`,
        recommendation: 'Data integrity issue: required fields should always have values. Review data ingestion pipeline.',
      });
    }
  }

  return { findings, fieldAnalysis };
}

export async function reviewCollection(client: Client, args: unknown) {
  const { collection_name, sample_size } = ReviewCollectionArgsSchema.parse(args);

  try {
    // Get collection schema
    const schema = await client.collections(collection_name).retrieve() as CollectionSchema;

    // Sample documents for analysis
    let documents: Record<string, unknown>[] = [];
    try {
      const exportResult = await client.collections(collection_name).documents().export({});
      const lines = exportResult.split('\n').filter(line => line.trim());
      documents = lines.slice(0, sample_size).map(line => JSON.parse(line) as Record<string, unknown>);
    } catch {
      // Collection might be empty or export might fail
    }

    // Perform analysis
    const schemaFindings = analyzeSchema(schema);
    const { findings: documentFindings, fieldAnalysis } = analyzeDocuments(schema, documents);

    // Combine and sort findings by severity
    const allFindings = [...schemaFindings, ...documentFindings];
    const severityOrder = { critical: 0, warning: 1, suggestion: 2, info: 3 };
    allFindings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Build summary
    const fields = schema.fields || [];
    const review: CollectionReview = {
      collection_name,
      summary: {
        total_documents: schema.num_documents || 0,
        total_fields: fields.length,
        searchable_fields: fields.filter(f => f.index !== false && ['string', 'string[]', 'auto'].includes(f.type)).length,
        facet_fields: fields.filter(f => f.facet).length,
        sortable_fields: fields.filter(f => f.sort).length,
      },
      findings: allFindings,
      field_analysis: fieldAnalysis,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(review, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

export const reviewTools = [
  {
    name: 'typesense_review_collection',
    description: 'Analyze a collection\'s schema and documents to identify potential improvements for search quality, performance, and data structure',
    inputSchema: {
      type: 'object' as const,
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection to review',
        },
        sample_size: {
          type: 'number',
          description: 'Number of documents to sample for analysis (default: 100)',
          default: 100,
        },
      },
      required: ['collection_name'],
    },
  },
];
