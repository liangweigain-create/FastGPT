import type { NextApiRequest, NextApiResponse } from 'next';
import { authCert } from '@fastgpt/service/support/permission/auth/common';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import dayjs from 'dayjs';
import { NextAPI } from '@/service/middleware/entry';

async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const { teamId } = await authCert({ req, authToken: true });

  const members = await MongoTeamMember.find({ teamId }).sort({ createTime: 1 }).lean();

  const data = members.map((member) => ({
    name: member.name,
    role: member.role === TeamMemberRoleEnum.owner ? 'Owner' : 'Member',
    status: member.status,
    joinTime: dayjs(member.createTime).format('YYYY-MM-DD HH:mm:ss')
  }));

  const csvHeader = ['Name', 'Role', 'Status', 'Join Time'];
  const csvString = [
    csvHeader.join(','),
    ...data.map((item) => Object.values(item).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=members.csv');
  res.send(csvString);
}

export default NextAPI(handler);
