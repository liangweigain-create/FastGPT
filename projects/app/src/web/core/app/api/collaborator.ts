import {
  type UpdateAppCollaboratorBody,
  type GetAppCollaboratorListQuery,
  type DeleteAppCollaboratorQuery
} from '@fastgpt/global/openapi/core/app/collaborator';
import { DELETE, GET, POST } from '@/web/common/api/request';
import type { CollaboratorListType } from '@fastgpt/global/support/permission/collaborator';

export const getCollaboratorList = (appId: string) =>
  GET<CollaboratorListType>('/core/app/collaborator/list', { appId });

export const postUpdateAppCollaborators = (body: UpdateAppCollaboratorBody) =>
  POST('/core/app/collaborator/update', body);

export const deleteAppCollaborators = (params: DeleteAppCollaboratorQuery) =>
  DELETE('/core/app/collaborator/delete', params);
