import type { Client } from 'typesense';
import { z } from 'zod';
import { handleTypesenseError } from '../utils/errors.js';

/**
 * List all analytics rules
 */
export async function listAnalyticsRules(client: Client) {
  try {
    const rules = await client.analytics.rules().retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(rules, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

/**
 * Get a specific analytics rule
 */
const GetAnalyticsRuleArgsSchema = z.object({
  rule_name: z.string().describe('Name of the analytics rule to retrieve'),
});

export async function getAnalyticsRule(client: Client, args: unknown) {
  const { rule_name } = GetAnalyticsRuleArgsSchema.parse(args);

  try {
    const rule = await client.analytics.rules(rule_name).retrieve();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(rule, null, 2),
        },
      ],
    };
  } catch (error) {
    handleTypesenseError(error);
  }
}

export const analyticsTools = [
  {
    name: 'typesense_list_analytics_rules',
    description: 'List all analytics rules configured in the cluster',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'typesense_get_analytics_rule',
    description: 'Get a specific analytics rule by name',
    inputSchema: {
      type: 'object' as const,
      properties: {
        rule_name: { type: 'string', description: 'Name of the analytics rule to retrieve' },
      },
      required: ['rule_name'],
    },
  },
];
