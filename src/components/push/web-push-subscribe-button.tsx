"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { savePushSubscription, removePushSubscription } from "@/actions/push";
import { urlBase64ToUint8Array } from "@/lib/push/url-base64";

/**
 * 注册 `/sw.js`、申请通知权限并上报 Web Push 订阅（需配置 NEXT_PUBLIC_VAPID_PUBLIC_KEY）。
 */
export function WebPushSubscribeButton() {
  const [pending, start] = useTransition();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const refreshSubscriptionState = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSubscribed(false);
      return;
    }
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    setSubscribed(!!sub);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refreshSubscriptionState();
    }, 0);
    return () => window.clearTimeout(t);
  }, [refreshSubscriptionState]);

  const onSubscribe = useCallback(() => {
    if (!vapidPublic) {
      toast.error("未配置 NEXT_PUBLIC_VAPID_PUBLIC_KEY，无法订阅推送");
      return;
    }
    start(async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await reg.update();
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          toast.message("未授予通知权限");
          setSubscribed(false);
          return;
        }
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          await existing.unsubscribe();
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublic),
        });
        const json = sub.toJSON();
        const res = await savePushSubscription(json);
        if ("error" in res && res.error) {
          toast.error(res.error);
          setSubscribed(false);
          return;
        }
        toast.success("已开启桌面提醒（本设备）");
        setSubscribed(true);
      } catch (e) {
        console.error(e);
        toast.error("订阅失败，请使用 HTTPS 或 localhost 并重试");
        setSubscribed(false);
      }
    });
  }, [vapidPublic]);

  const onUnsubscribe = useCallback(() => {
    start(async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (sub) {
          const endpoint = sub.endpoint;
          await sub.unsubscribe();
          await removePushSubscription(endpoint);
        }
        toast.success("已关闭本设备推送");
        setSubscribed(false);
      } catch (e) {
        console.error(e);
        toast.error("取消订阅失败");
      }
    });
  }, []);

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="hidden gap-1 sm:inline-flex"
      disabled={pending || !vapidPublic}
      title={!vapidPublic ? "请在环境变量中配置 VAPID 公钥" : undefined}
      onClick={() => {
        if (subscribed) {
          void onUnsubscribe();
        } else {
          void onSubscribe();
        }
      }}
    >
      {subscribed === true ? (
        <>
          <BellOff className="size-4" />
          关闭提醒
        </>
      ) : (
        <>
          <Bell className="size-4" />
          桌面提醒
        </>
      )}
    </Button>
  );
}
