import { z } from 'zod';

/* ============================================================================
 * API: Get App Collaborator List
 * Route: GET /api/core/app/collaborator/list
 * Method: GET
 * Description: Get a list of collaborators for a specific app
 * Tags: ['App', 'Collaborator', 'Read']
 * ============================================================================ */
export const GetAppCollaboratorListQuerySchema = z.object({
  appId: z.string().min(1).meta({
    description: 'App ID',
    example: '64b1234567890'
  })
});
export type GetAppCollaboratorListQuery = z.infer<typeof GetAppCollaboratorListQuerySchema>;

/* ============================================================================
 * API: Update App Collaborators (Sync)
 * Route: POST /api/core/app/collaborator/update
 * Method: POST
 * Description: Batch update app collaborators.
 * WARN: This is a sync operation. Collaborators not in the list will be removed.
 * Tags: ['App', 'Collaborator', 'Update']
 * ============================================================================ */
export const UpdateAppCollaboratorBodySchema = z.object({
  appId: z.string().min(1).meta({
    description: 'App ID',
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
export type UpdateAppCollaboratorBody = z.infer<typeof UpdateAppCollaboratorBodySchema>;

/* ============================================================================
 * API: Delete App Collaborator
 * Route: DELETE /api/core/app/collaborator/delete
 * Method: DELETE
 * Description: Remove a single collaborator from app
 * Tags: ['App', 'Collaborator', 'Delete']
 * ============================================================================ */
export const DeleteAppCollaboratorQuerySchema = z.object({
  appId: z.string().min(1).meta({
    description: 'App ID'
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
export type DeleteAppCollaboratorQuery = z.infer<typeof DeleteAppCollaboratorQuerySchema>;
