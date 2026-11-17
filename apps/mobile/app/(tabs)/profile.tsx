import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "@/components/Icon";
import { ProfileSheet, type SheetTarget } from "@/components/ProfileSheets";
import { type FullProfile, ProfileView } from "@/components/ProfileView";
import { Button, Section } from "@/components/ui";
import { deleteAccount } from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { changeAvatar, removeAvatar } from "@/lib/avatar";
import { completeness } from "@/lib/completeness.logic";
import { openLegal, PRIVACY_URL, TERMS_URL } from "@/lib/legal";
import { SITE_URL } from "@/lib/config";
import { reportError } from "@/lib/errorReport";
import { supabase } from "@/lib/supabase";
import { addToWallet } from "@/lib/wallet";
import { c, grad } from "@/theme/tokens";
import { hasSmartContactsPass } from "../../modules/wallet-pass";

// Spec: docs/01-product/features/profile.md — "Мой профиль" is edited in place: every section is visible with
// "+ Добавить"; "Как видят другие" hides the owner controls and shows exactly the public view.
export default function MyProfile() {
  const { profile, reloadProfile } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [sheet, setSheet] = useState<SheetTarget | null>(null);
  const [version, setVersion] = useState(0);
  const [preview, setPreview] = useState(false);
  const [full, setFull] = useState<FullProfile | null>(null);
  const [inWallet, setInWallet] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const refresh = useCallback(() => {
    reloadProfile();
    setVersion((v) => v + 1);
  }, [reloadProfile]);

  // Coming back to the tab: reload data and re-check whether the card is in Wallet. Runs once per focus
  // (the latest refresh is read from a ref so a profile reload does not re-trigger the effect).
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const uid = profile?.id;
  useFocusEffect(
    useCallback(() => {
      refreshRef.current();
      if (uid) setInWallet(hasSmartContactsPass(uid));
    }, [uid]),
  );

  if (!profile) return null;

  // SC-072 · docs/01-product/features/account-deletion.md
  const confirmDelete = () =>
    Alert.alert(
      "Удалить аккаунт?",
      "Профиль, книжка контактов, заметки, комнаты и задачи AI будут удалены навсегда. Ссылка и QR перестанут работать. Отменить это нельзя.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить навсегда",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              const done = await deleteAccount();
              if (!done) setDeleting(false); // cancelled the Apple confirmation
            } catch (e) {
              setDeleting(false);
              const status = (e as { context?: { status?: number } }).context?.status;
              reportError(e, { context: { kind: "delete-account", status } });
              Alert.alert("Не получилось удалить", "Проверьте интернет и попробуйте ещё раз.");
            }
          },
        },
      ],
    );

  const photo = async (source: "library" | "camera") => {
    setPhotoBusy(true);
    try {
      const url = await changeAvatar(profile.id, source);
      if (url) refresh();
    } catch (e) {
      const denied = e instanceof Error && e.message === "permission_denied";
      if (!denied) reportError(e, { context: { kind: "avatar" } });
      Alert.alert(
        "Фото не загрузилось",
        denied ? "Разрешите доступ к фото в Настройках iPhone." : "Проверьте интернет и попробуйте ещё раз.",
      );
    } finally {
      setPhotoBusy(false);
    }
  };
  const askPhoto = () =>
    Alert.alert("Фото профиля", "Лучше всего — портрет по плечи на нейтральном фоне.", [
      { text: "Выбрать из галереи", onPress: () => photo("library") },
      { text: "Сфотографироваться", onPress: () => photo("camera") },
      ...(profile.avatar_url
        ? [
            {
              text: "Удалить фото",
              style: "destructive" as const,
              onPress: () => removeAvatar(profile.id).then(refresh),
            },
          ]
        : []),
      { text: "Отмена", style: "cancel" as const },
    ]);

  const url = `${SITE_URL}/${profile.handle}`;
  const openSeeks = full?.profile_seeks?.length ?? 0;
  const comp = completeness(profile, openSeeks);
  const isPaid = profile.plan === "pro" || profile.plan === "business";

  const action = (icon: IconName, label: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: c.surface,
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: "center",
        gap: 4,
      }}
    >
      <Icon name={icon} size={20} />
      <Text style={{ color: c.ink, fontSize: 12 }}>{label}</Text>
    </Pressable>
  );

  const walletButton =
    Platform.OS === "ios" && !preview && isPaid && !inWallet ? (
      <Pressable
        onPress={async () => {
          await addToWallet(isPaid);
          setInWallet(hasSmartContactsPass(profile.id)); // the Safari sheet does not blur the tab
        }}
        accessibilityRole="button"
        accessibilityLabel="Add to Apple Wallet"
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: "#000",
          borderWidth: 1,
          borderColor: "#3A3A3F",
          borderRadius: 9,
          paddingHorizontal: 10,
          paddingVertical: 7,
          marginBottom: 4,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 15 }}></Text>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Add to Apple Wallet</Text>
      </Pressable>
    ) : null;

  const ownerControls = preview ? null : (
    <View>
      {comp.todo.length ? (
        <View style={{ backgroundColor: c.surface, borderRadius: 18, padding: 14, marginTop: 10, gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Text style={{ color: c.ink, fontSize: 15, fontWeight: "700" }}>Профиль заполнен на {comp.pct}%</Text>
            <Text style={{ color: c.muted, fontSize: 12.5 }}>
              {comp.done} из {comp.total}
            </Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: comp.pct }}
            style={{ height: 7, borderRadius: 4, backgroundColor: c.surface2, overflow: "hidden" }}
          >
            <View style={{ width: `${comp.pct}%`, height: "100%", borderRadius: 4, backgroundColor: grad[1] }} />
          </View>
          <Text style={{ color: c.muted, fontSize: 12.5 }}>
            Это видят люди, когда сканируют ваш QR. Нажмите на любой раздел ниже, чтобы заполнить.
          </Text>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        {action("qr", "Мой QR", () => router.push("/profile/qr"))}
        {action("share", "Поделиться", () => Share.share({ message: `${profile.full_name} — ${url}` }))}
        {action("people", "Пригласить", () => router.push("/invite"))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardDismissMode="on-drag">
        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 10 }}>
          <View style={{ flexDirection: "row", backgroundColor: c.surface, borderRadius: 999, padding: 3 }}>
            {[
              { v: false, label: "Мой профиль" },
              { v: true, label: "Как видят другие" },
            ].map((o) => (
              <Pressable
                key={o.label}
                onPress={() => setPreview(o.v)}
                accessibilityRole="button"
                accessibilityState={{ selected: preview === o.v }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: preview === o.v ? c.surface2 : "transparent",
                }}
              >
                <Text style={{ color: preview === o.v ? c.ink : c.muted, fontSize: 12.5 }}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <ProfileView
          id={profile.id}
          version={version}
          owner={!preview}
          onEdit={setSheet}
          onPhoto={photoBusy ? undefined : askPhoto}
          onLoaded={setFull}
          headerRight={walletButton}
          afterHeader={ownerControls}
        />
        {preview ? null : (
          <>
            <Section>Ссылка на профиль</Section>
            <Pressable onPress={() => Linking.openURL(url)}>
              <Text style={{ color: c.accentInk }}>{url.replace("https://", "")}</Text>
            </Pressable>
            <Button
              kind="ghost"
              small
              title="Выйти"
              onPress={() => supabase.auth.signOut()}
              disabled={deleting}
              style={{ marginTop: 28 }}
            />
            <Pressable
              onPress={confirmDelete}
              disabled={deleting}
              accessibilityRole="button"
              style={{ marginTop: 16, alignItems: "center", paddingVertical: 8 }}
            >
              <Text style={{ color: c.danger, fontSize: 14 }}>{deleting ? "Удаляем…" : "Удалить аккаунт"}</Text>
            </Pressable>
            <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginTop: 8 }}>
              <Pressable onPress={() => openLegal(PRIVACY_URL)} accessibilityRole="link" hitSlop={8}>
                <Text style={{ color: c.muted, fontSize: 12.5 }}>Конфиденциальность</Text>
              </Pressable>
              <Pressable onPress={() => openLegal(TERMS_URL)} accessibilityRole="link" hitSlop={8}>
                <Text style={{ color: c.muted, fontSize: 12.5 }}>Условия</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
      <ProfileSheet
        profile={profile}
        helps={profile.helps ?? []}
        target={sheet}
        onClose={() => setSheet(null)}
        onSaved={() => {
          setSheet(null);
          refresh();
        }}
      />
    </SafeAreaView>
  );
}
