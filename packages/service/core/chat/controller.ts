import type { ChatHistoryItemResType, ChatItemType, AIChatItemType, UserChatItemType } from '@fastgpt/global/core/chat/type';
import { MongoChatItem } from './chatItemSchema';
import { MongoChat } from './chatSchema';
import { addLog } from '../../common/system/log';
import { DispatchNodeResponseKeyEnum, SseResponseEventEnum } from '@fastgpt/global/core/workflow/runtime/constants';
import type { ChatSourceEnum } from '@fastgpt/global/core/chat/constants';
import { ChatRoleEnum, ChatItemValueTypeEnum } from '@fastgpt/global/core/chat/constants';
import { MongoChatItemResponse } from './chatItemResponseSchema';
import type { ClientSession } from '../../common/mongo';
import { Types } from '../../common/mongo';
import { mongoSessionRun } from '../../common/mongo/sessionRun';
import { UserError } from '@fastgpt/global/common/error/utils';
import type { NextApiRequest, NextApiResponse } from 'next';
import { sseErrRes, responseWrite } from '../../common/response';
import { UsageSourceEnum } from '@fastgpt/global/support/wallet/usage/constants';
import { authApp } from '../../support/permission/app/auth';
import { dispatchWorkFlow } from '../workflow/dispatch';
import { getRunningUserInfoByTmbId } from '../../support/user/team/utils';
import type { StoreEdgeItemType } from '@fastgpt/global/core/workflow/type/edge';
import {
  concatHistories,
  getChatTitleFromChatMessage,
  removeEmptyUserInput
} from '@fastgpt/global/core/chat/utils';
import type { PermissionValueType } from '@fastgpt/global/support/permission/type';
import { AppTypeEnum } from '@fastgpt/global/core/app/constants';
import {
  serverGetWorkflowToolRunUserQuery,
  updateWorkflowToolInputByVariables
} from '../app/tool/workflowTool/utils';
import { GPTMessages2Chats } from '@fastgpt/global/core/chat/adapt';
import type { ChatCompletionMessageParam } from '@fastgpt/global/core/ai/type';
import type { AppChatConfigType } from '@fastgpt/global/core/app/type';
import {
  getLastInteractiveValue,
  getMaxHistoryLimitFromNodes,
  getWorkflowEntryNodeIds,
  storeEdges2RuntimeEdges,
  rewriteNodeOutputByHistories,
  storeNodes2RuntimeNodes,
  textAdaptGptResponse
} from '@fastgpt/global/core/workflow/runtime/utils';
import type { StoreNodeItemType } from '@fastgpt/global/core/workflow/type/node';
import { getWorkflowResponseWrite } from '../workflow/dispatch/utils';
import { WORKFLOW_MAX_RUN_TIMES } from '../workflow/constants';
import { getWorkflowToolInputsFromStoreNodes } from '@fastgpt/global/core/app/tool/workflowTool/utils';
import { saveChat, updateInteractiveChat } from './saveChat';
import { getLocale } from '../../common/middle/i18n';
import { formatTime2YMDHM } from '@fastgpt/global/common/string/time';
import { LimitTypeEnum, teamFrequencyLimit } from '../../common/api/frequencyLimit';
import { getIpFromRequest } from '../../common/geo';
import { pushTrack } from '../../common/middle/tracks/utils';

export async function getChatItems({
  includeDeleted = false,
  appId,
  chatId,
  field,
  limit,

  offset,
  initialId,
  prevId,
  nextId
}: {
  includeDeleted?: boolean;
  appId: string;
  chatId?: string;
  field: string;
  limit: number;

  offset?: number;
  initialId?: string;
  prevId?: string;
  nextId?: string;
}): Promise<{
  histories: ChatItemType[];
  total: number;
  hasMorePrev: boolean;
  hasMoreNext: boolean;
}> {
  if (!chatId) {
    return { histories: [], total: 0, hasMorePrev: false, hasMoreNext: false };
  }

  // Extend dataId
  field = `dataId ${field}`;
  const baseCondition = includeDeleted ? { appId, chatId } : { appId, chatId, deleteTime: null };

  const { histories, total, hasMorePrev, hasMoreNext } = await (async () => {
    // Mode 1: offset pagination (original logic)
    if (offset !== undefined) {
      const [foundHistories, count] = await Promise.all([
        MongoChatItem.find(baseCondition, field).sort({ _id: -1 }).skip(offset).limit(limit).lean(),
        MongoChatItem.countDocuments(baseCondition)
      ]);
      return {
        histories: foundHistories.reverse(),
        total: count,
        hasMorePrev: count > limit,
        hasMoreNext: offset > 0
      };
    }
    // Mode 2: prevId - get records before the target
    else if (prevId) {
      const prevItem = await MongoChatItem.findOne(
        {
          ...baseCondition,
          dataId: prevId
        },
        { _id: 1 }
      ).lean();
      if (!prevItem) return Promise.reject(new UserError('Prev item not found'));

      const [items, count] = await Promise.all([
        MongoChatItem.find({ ...baseCondition, _id: { $lt: prevItem._id } }, field)
          .sort({ _id: -1 })
          .limit(limit + 1)
          .lean(),
        MongoChatItem.countDocuments({ ...baseCondition })
      ]);

      return {
        histories: items.slice(0, limit).reverse(),
        total: count,
        hasMorePrev: items.length > limit,
        hasMoreNext: true
      };
    }
    // Mode 3: nextId - get records after the target
    else if (nextId) {
      const nextItem = await MongoChatItem.findOne(
        {
          ...baseCondition,
          dataId: nextId
        },
        { _id: 1 }
      ).lean();
      if (!nextItem) return Promise.reject(new UserError('Next item not found'));

      const [items, total] = await Promise.all([
        MongoChatItem.find({ ...baseCondition, _id: { $gt: nextItem._id } }, field)
          .sort({ _id: 1 })
          .limit(limit + 1)
          .lean(),
        MongoChatItem.countDocuments({ ...baseCondition })
      ]);

      return {
        histories: items.slice(0, limit),
        total,
        hasMorePrev: true,
        hasMoreNext: items.length > limit
      };
    }
    // Mode 2: initialId - get records around the target
    else {
      if (!initialId) {
        const [foundHistories, count] = await Promise.all([
          MongoChatItem.find(baseCondition, field).sort({ _id: -1 }).skip(0).limit(limit).lean(),
          MongoChatItem.countDocuments(baseCondition)
        ]);
        return {
          histories: foundHistories.reverse(),
          total: count,
          hasMorePrev: count > limit,
          hasMoreNext: false
        };
      }

      const halfLimit = Math.floor(limit / 2);
      const ceilLimit = Math.ceil(limit / 2);

      const targetItem = await MongoChatItem.findOne(
        { ...baseCondition, dataId: initialId },
        field
      ).lean();
      if (!targetItem) return Promise.reject(new UserError('Target item not found'));

      const [prevItems, nextItems, count] = await Promise.all([
        MongoChatItem.find({ ...baseCondition, _id: { $lt: targetItem._id } }, field)
          .sort({ _id: -1 })
          .limit(halfLimit + 1)
          .lean(),
        MongoChatItem.find({ ...baseCondition, _id: { $gt: targetItem._id } }, field)
          .sort({ _id: 1 })
          .limit(ceilLimit + 1)
          .lean(),
        MongoChatItem.countDocuments(baseCondition)
      ]);

      return {
        histories: [
          ...prevItems.slice(0, halfLimit).reverse(),
          targetItem,
          ...nextItems.slice(0, ceilLimit)
        ].filter(Boolean),
        total: count,
        hasMorePrev: prevItems.length > halfLimit,
        hasMoreNext: nextItems.length > ceilLimit
      };
    }
  })();

  // Add node responses field
  if (field.includes(DispatchNodeResponseKeyEnum.nodeResponse) && histories.length > 0) {
    const chatItemDataIds = histories
      .filter((item) => item.obj === ChatRoleEnum.AI && !item.responseData?.length)
      .map((item) => item.dataId);

    if (chatItemDataIds.length > 0) {
      const chatItemResponsesMap = await MongoChatItemResponse.find(
        { appId, chatId, chatItemDataId: { $in: chatItemDataIds } },
        { chatItemDataId: 1, data: 1 }
      )
        .lean()
        .then((res) => {
          const map = new Map<string, ChatHistoryItemResType[]>();
          res.forEach((item) => {
            const val = map.get(item.chatItemDataId) || [];
            val.push(item.data);
            map.set(item.chatItemDataId, val);
          });
          return map;
        });

      histories.forEach((item) => {
        const val = chatItemResponsesMap.get(String(item.dataId));
        if (item.obj === ChatRoleEnum.AI && val) {
          item.responseData = val;
        }
      });
    }
  }

  return { histories, total, hasMorePrev, hasMoreNext };
}

/**
 * Update feedback count statistics for a chat in Chat table
 * This method aggregates feedback data from chatItems and updates the Chat table
 *
 * @param appId - Application ID
 * @param chatId - Chat ID
 * @param session - Optional MongoDB session for transaction support
 */
export async function updateChatFeedbackCount({
  appId,
  chatId,
  session
}: {
  appId: string;
  chatId: string;
  session?: ClientSession;
}): Promise<void> {
  try {
    // Aggregate feedback statistics from chatItems
    const stats = await MongoChatItem.aggregate(
      [
        {
          $match: {
            appId: new Types.ObjectId(appId),
            chatId,
            obj: ChatRoleEnum.AI
          }
        },
        {
          $group: {
            _id: null,
            goodFeedbackCount: {
              $sum: {
                $cond: [{ $ifNull: ['$userGoodFeedback', false] }, 1, 0]
              }
            },
            badFeedbackCount: {
              $sum: {
                $cond: [{ $ifNull: ['$userBadFeedback', false] }, 1, 0]
              }
            },
            // Calculate unread good feedback count
            unreadGoodFeedbackCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: [{ $ifNull: ['$isFeedbackRead', false] }, true] },
                      { $ne: [{ $ifNull: ['$userGoodFeedback', null] }, null] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            // Calculate unread bad feedback count
            unreadBadFeedbackCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: [{ $ifNull: ['$isFeedbackRead', false] }, true] },
                      { $ne: [{ $ifNull: ['$userBadFeedback', null] }, null] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ],
      { session }
    );

    const feedbackStats = stats[0] || {
      goodFeedbackCount: 0,
      badFeedbackCount: 0,
      unreadGoodFeedbackCount: 0,
      unreadBadFeedbackCount: 0
    };

    // Calculate boolean flags
    const hasGoodFeedback = feedbackStats.goodFeedbackCount > 0;
    const hasBadFeedback = feedbackStats.badFeedbackCount > 0;
    const hasUnreadGoodFeedback = feedbackStats.unreadGoodFeedbackCount > 0;
    const hasUnreadBadFeedback = feedbackStats.unreadBadFeedbackCount > 0;

    // Build update object - only set fields that are true, unset fields that are false
    const updateObj: Record<string, any> = {};
    const unsetObj: Record<string, any> = {};

    if (hasGoodFeedback) {
      updateObj.hasGoodFeedback = true;
    } else {
      unsetObj.hasGoodFeedback = '';
    }

    if (hasBadFeedback) {
      updateObj.hasBadFeedback = true;
    } else {
      unsetObj.hasBadFeedback = '';
    }

    if (hasUnreadGoodFeedback) {
      updateObj.hasUnreadGoodFeedback = true;
    } else {
      unsetObj.hasUnreadGoodFeedback = '';
    }

    if (hasUnreadBadFeedback) {
      updateObj.hasUnreadBadFeedback = true;
    } else {
      unsetObj.hasUnreadBadFeedback = '';
    }

    // Build the final update query
    const updateQuery: Record<string, any> = {};
    if (Object.keys(updateObj).length > 0) {
      updateQuery.$set = updateObj;
    }
    if (Object.keys(unsetObj).length > 0) {
      updateQuery.$unset = unsetObj;
    }

    // Update Chat table with aggregated statistics and boolean flags
    await MongoChat.updateOne(
      {
        appId,
        chatId
      },
      updateQuery,
      {
        session
      }
    );

    addLog.debug('updateChatFeedbackCount success', {
      appId,
      chatId,
      stats: feedbackStats,
      hasGoodFeedback,
      hasBadFeedback,
      hasUnreadGoodFeedback,
      hasUnreadBadFeedback
    });
  } catch (error) {
    addLog.error('updateChatFeedbackCount error', error);
    throw error;
  }
}

export type DispatchChatProps = {
  messages: ChatCompletionMessageParam[];
  responseChatItemId: string;
  nodes: StoreNodeItemType[];
  edges: StoreEdgeItemType[];
  variables: Record<string, any>;
  appId: string;
  appName: string;
  chatId: string;
  chatConfig: AppChatConfigType;
};

export async function dispatchChatCompletion({
  req,
  res,
  body,
  permission = -1,
  chatSource
}: {
  req: NextApiRequest;
  res: NextApiResponse;
  body: DispatchChatProps;
  permission?: PermissionValueType;
  chatSource: ChatSourceEnum;
}) {
  let {
    nodes = [],
    edges = [],
    messages = [],
    responseChatItemId,
    variables = {},
    appName,
    appId,
    chatConfig,
    chatId
  } = body || {};

  try {
    if (!Array.isArray(nodes)) {
      throw new Error('Nodes is not array');
    }
    if (!Array.isArray(edges)) {
      throw new Error('Edges is not array');
    }

    const originIp = getIpFromRequest(req);
    const chatMessages = GPTMessages2Chats({ messages });

    /* user auth */
    const { app, teamId, tmbId } = await authApp({
      req,
      authToken: true,
      appId,
      per: permission
    });

    if (
      !(await teamFrequencyLimit({
        teamId,
        type: LimitTypeEnum.chat,
        res
      }))
    ) {
      return;
    }

    pushTrack.teamChatQPM({ teamId });

    const isPlugin = app.type === AppTypeEnum.workflowTool;
    const isTool = app.type === AppTypeEnum.tool;

    const userQuestion: UserChatItemType = await (async () => {
      if (isPlugin) {
        return serverGetWorkflowToolRunUserQuery({
          pluginInputs: getWorkflowToolInputsFromStoreNodes(nodes),
          variables,
          files: variables.files
        });
      }
      if (isTool) {
        return {
          obj: ChatRoleEnum.Human,
          value: [
            {
              type: ChatItemValueTypeEnum.text,
              text: { content: 'tool test' }
            }
          ]
        };
      }

      const latestHumanChat = chatMessages.pop() as UserChatItemType;
      if (!latestHumanChat) {
        return Promise.reject(new UserError('User question is empty'));
      }
      return latestHumanChat;
    })();

    const limit = getMaxHistoryLimitFromNodes(nodes);
    const [{ histories }, chatDetail] = await Promise.all([
      getChatItems({
        appId,
        chatId,
        offset: 0,
        limit,
        field: `obj value memories`
      }),
      MongoChat.findOne({ appId: app._id, chatId }, 'source variableList variables')
    ]);

    if (chatDetail?.variables) {
      variables = {
        ...chatDetail.variables,
        ...variables
      };
    }

    const newHistories = concatHistories(histories, chatMessages);
    const interactive = getLastInteractiveValue(newHistories) || undefined;
    
    // Get runtimeNodes
    let runtimeNodes = storeNodes2RuntimeNodes(nodes, getWorkflowEntryNodeIds(nodes, interactive));
    if (isPlugin) {
      runtimeNodes = updateWorkflowToolInputByVariables(runtimeNodes, variables);
      variables = {};
    }
    runtimeNodes = rewriteNodeOutputByHistories(runtimeNodes, interactive);

    const workflowResponseWrite = getWorkflowResponseWrite({
      res,
      detail: true,
      streamResponse: true,
      id: chatId,
      showNodeStatus: true
    });

    /* start process */
    const {
      flowResponses,
      assistantResponses,
      system_memories,
      newVariables,
      durationSeconds,
      customFeedbacks
    } = await dispatchWorkFlow({
      apiVersion: 'v2',
      res,
      lang: getLocale(req),
      requestOrigin: req.headers.origin,
      mode: 'test',
      usageSource: UsageSourceEnum.fastgpt,

      uid: tmbId,

      runningAppInfo: {
        id: appId,
        name: appName,
        teamId: app.teamId,
        tmbId: app.tmbId
      },
      runningUserInfo: await getRunningUserInfoByTmbId(tmbId),

      chatId,
      responseChatItemId,
      runtimeNodes,
      runtimeEdges: storeEdges2RuntimeEdges(edges, interactive),
      variables,
      query: removeEmptyUserInput(userQuestion.value),
      lastInteractive: interactive,
      chatConfig,
      histories: newHistories,
      stream: true,
      maxRunTimes: WORKFLOW_MAX_RUN_TIMES,
      workflowStreamResponse: workflowResponseWrite,
      responseDetail: true
    });

    workflowResponseWrite({
      event: SseResponseEventEnum.answer,
      data: textAdaptGptResponse({
        text: null,
        finish_reason: 'stop'
      })
    });
    responseWrite({
      res,
      event: SseResponseEventEnum.answer,
      data: '[DONE]'
    });

    // save chat
    const isInteractiveRequest = !!getLastInteractiveValue(histories);

    const newTitle = isPlugin
      ? variables.cTime || formatTime2YMDHM(new Date())
      : getChatTitleFromChatMessage(userQuestion);

    const aiResponse: AIChatItemType & { dataId?: string } = {
      dataId: responseChatItemId,
      obj: ChatRoleEnum.AI,
      value: assistantResponses,
      memories: system_memories,
      [DispatchNodeResponseKeyEnum.nodeResponse]: flowResponses,
      customFeedbacks
    };
    const params = {
      chatId,
      appId: app._id,
      teamId,
      tmbId: tmbId,
      nodes,
      appChatConfig: chatConfig,
      variables: newVariables,
      newTitle,
      source: chatSource,
      userContent: userQuestion,
      aiContent: aiResponse,
      durationSeconds,
      metadata: {
        originIp
      }
    };

    if (isInteractiveRequest) {
      await updateInteractiveChat(params);
    } else {
      await saveChat(params);
    }
  } catch (err: any) {
    res.status(500);
    sseErrRes(res, err);
  }
}
