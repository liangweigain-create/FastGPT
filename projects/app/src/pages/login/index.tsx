import React, { useCallback } from 'react';
import { useRouter } from 'next/router';
import { serviceSideProps } from '@/web/common/i18n/utils';
import { clearToken } from '@/web/support/user/auth';
import { useMount } from 'ahooks';
import LoginModal from '@/pageComponents/login/LoginModal';
import { postAcceptInvitationLink } from '@/web/support/user/team/api';
import type { LoginSuccessResponse } from '@/global/support/api/userRes';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { useTranslation } from 'next-i18next';
import { useUserStore } from '@/web/support/user/useUserStore';
import { subRoute } from '@fastgpt/web/common/system/utils';
import { validateRedirectUrl } from '@/web/common/utils/uri';

const Login = () => {
  const router = useRouter();
  const { lastRoute = '' } = router.query as { lastRoute: string };
  const { t } = useTranslation();
  const { toast } = useToast();
  const { setUserInfo } = useUserStore();

  const loginSuccess = useCallback(
    async (res: LoginSuccessResponse) => {
      setUserInfo(res.user);

      const decodeLastRoute = validateRedirectUrl(lastRoute);

      const navigateTo = await (async () => {
        if (res.user.team.status !== 'active') {
          if (decodeLastRoute.includes('/account/team?invitelinkid=')) {
            const id = decodeLastRoute.split('invitelinkid=')[1];
            await postAcceptInvitationLink(id);
            return '/dashboard/agent';
          } else {
            toast({
              status: 'warning',
              title: t('common:not_active_team')
            });
          }
        }
        if (decodeLastRoute.startsWith(`${subRoute}/config`)) {
          return '/dashboard/agent';
        }

        // [Privatization] 增加功能，如果用户没有读取权限，则跳转到聊天页面
        if (!res.user.team.permission.hasReadPer) {
          return '/chat';
        }

        return decodeLastRoute;
      })();

      navigateTo && router.replace(navigateTo);
    },
    [lastRoute, router, setUserInfo, t, toast]
  );

  useMount(() => {
    clearToken();
    router.prefetch('/dashboard/agent');
  });

  return <LoginModal onSuccess={loginSuccess} />;
};

export async function getServerSideProps(context: any) {
  return {
    props: {
      ...(await serviceSideProps(context, ['app', 'user', 'login']))
    }
  };
}

export default Login;
