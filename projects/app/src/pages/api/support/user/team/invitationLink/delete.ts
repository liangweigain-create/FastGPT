import { NextAPI } from '@/service/middleware/entry';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/schema';
import { getTmbPermission } from '@fastgpt/service/support/permission/controller';
import {
  PerResourceTypeEnum,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { Permission } from '@fastgpt/global/support/permission/controller';

async function handler(req: any, res: any) {
  const { teamId, tmbId } = await authCert({ req, authToken: true });

  const perVal = await getTmbPermission({
    teamId,
    tmbId,
    resourceType: PerResourceTypeEnum.team,
    resourceId: undefined
  });

  const per = new Permission({ role: perVal, isOwner: false });
  if (!per.checkPer(ManagePermissionVal)) {
    throw new Error('No Permission');
  }

  const { _id } = req.query as { _id: string };

  await MongoInvitationLink.findOneAndDelete({ _id, teamId });
}

export default NextAPI(handler);
