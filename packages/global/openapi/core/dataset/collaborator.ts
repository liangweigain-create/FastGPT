import { z } from 'zod';

/* ============================================================================
 * API: Get Dataset Collaborator List
 * Route: GET /api/core/dataset/collaborator/list
 * Method: GET
 * Description: Get a list of collaborators for a specific dataset
 * Tags: ['Dataset', 'Collaborator', 'Read']
 * ============================================================================ */
export const GetDatasetCollaboratorListQuerySchema = z.object({
  datasetId: z.string().min(1).meta({
    description: 'Dataset ID',
    example: '64b1234567890'
  })
});
export type GetDatasetCollaboratorListQuery = z.infer<typeof GetDatasetCollaboratorListQuerySchema>;

/* ============================================================================
 * API: Update Dataset Collaborators (Sync)
 * Route: POST /api/core/dataset/collaborator/update
 * Method: POST
 * Description: Batch update dataset collaborators.
 * WARN: This is a sync operation. Collaborators not in the list will be removed.
 * Tags: ['Dataset', 'Collaborator', 'Update']
 * ============================================================================ */
export const UpdateDatasetCollaboratorBodySchema = z.object({
  datasetId: z.string().min(1).meta({
    description: 'Dataset ID',
    example: '64b1234567890'
  }),
  collaborators: z
    .array(
      z.object({
        tmbId: z.string().optional().meta({
          description: 'Team Member ID'
        }),
        groupId: z.string().optional().meta({
          description: 'Group ID'
        }),
        orgId: z.string().optional().meta({
          description: 'Organization ID'
        }),
        permission: z.number().meta({
          description: 'Permission Value',
          example: 1
        })
      })
    )
    .meta({
      description: 'List of collaborators to sync'
    })
});
export type UpdateDatasetCollaboratorBody = z.infer<typeof UpdateDatasetCollaboratorBodySchema>;

/* ============================================================================
 * API: Delete Dataset Collaborator
 * Route: DELETE /api/core/dataset/collaborator/delete
 * Method: DELETE
 * Description: Remove a single collaborator from dataset
 * Tags: ['Dataset', 'Collaborator', 'Delete']
 * ============================================================================ */
export const DeleteDatasetCollaboratorQuerySchema = z.object({
  datasetId: z.string().min(1).meta({
    description: 'Dataset ID'
  }),
  tmbId: z.string().optional().meta({
    description: 'Team Member ID to delete'
  }),
  groupId: z.string().optional().meta({
    description: 'Group ID to delete'
  }),
  orgId: z.string().optional().meta({
    description: 'Organization ID to delete'
  })
});
export type DeleteDatasetCollaboratorQuery = z.infer<typeof DeleteDatasetCollaboratorQuerySchema>;
