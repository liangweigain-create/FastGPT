import {
  type UpdateDatasetCollaboratorBody,
  type GetDatasetCollaboratorListQuery,
  type DeleteDatasetCollaboratorQuery
} from '@fastgpt/global/openapi/core/dataset/collaborator';
import { DELETE, GET, POST } from '@/web/common/api/request';
import type { CollaboratorListType } from '@fastgpt/global/support/permission/collaborator';

// [Privatization] Using local API instead of proApi
export const getCollaboratorList = (datasetId: string) =>
  GET<CollaboratorListType>('/core/dataset/collaborator/list', { datasetId });

export const postUpdateDatasetCollaborators = (body: UpdateDatasetCollaboratorBody) =>
  POST('/core/dataset/collaborator/update', body);

export const deleteDatasetCollaborators = (params: DeleteDatasetCollaboratorQuery) => {
  return DELETE('/core/dataset/collaborator/delete', params);
};
