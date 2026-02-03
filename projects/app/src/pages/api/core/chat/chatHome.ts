import { NextAPI } from '@/service/middleware/entry';
import { dispatchChatCompletion } from '@fastgpt/service/core/chat/controller';
import { NullPermissionVal } from '@fastgpt/global/support/permission/constant';
import { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';

async function handler(req: any, res: any) {
  await dispatchChatCompletion({
    req,
    res,
    body: req.body,
    permission: NullPermissionVal,
    chatSource: ChatSourceEnum.online
  });
}

export default NextAPI(handler);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    responseLimit: '20mb'
  }
};
