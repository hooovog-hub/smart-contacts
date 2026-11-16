import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, type IconName } from "@/components/Icon";
import { ProfileView } from "@/components/ProfileView";
import { QuickAddSheet } from "@/components/QuickAddSheet";
import { Button, Section } from "@/components/ui";
import { deleteAccount } from "@/lib/account";
import { useAuth } from "@/lib/auth";
import { type AddKind, completeness, type Item } from "@/lib/completeness.logic";
import { SITE_URL } from "@/lib/config";
import { reportError } from "@/lib/errorReport";
import { supabase } from "@/lib/supabase";
import { c, grad } from "@/theme/tokens";

type SheetTarget = Extract<AddKind, { kind: "field" } | { kind: "link" }>;

// Spec: docs/01-product/features/profile.md — "Мой профиль" shows exactly what others see,
// plus owner-only controls: actions, and a completeness card while the profile is not complete.
export default function MyProfile() {
  const { profile, reloadProfile } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [sheet, setSheet] = useState<SheetTarget | null>(null);
  const [version, setVersion] = useState(0);

  // Coming back from "Изменить": reload both the owner data and the public view.
  useFocusEffect(
    useCallback(() => {
      reloadProfile();
      setVersion((v) => v + 1);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
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

  const url = `${SITE_URL}/${profile.handle}`;
  const comp = completeness(profile);

  const openItem = (it: Item) => {
    if (it.add.kind === "edit") router.push("/profile/edit");
    else setSheet(it.add);
  };

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

  const ownerControls = (
    <View>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        {action("qr", "Мой QR", () => router.push("/profile/qr"))}
        {action("edit", "Изменить", () => router.push("/profile/edit"))}
        {action("share", "Поделиться", () => Share.share({ message: `${profile.full_name} — ${url}` }))}
      </View>
      {comp.todo.length ? (
        <View style={{ backgroundColor: c.surface, borderRadius: 18, padding: 14, marginTop: 10, gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Text style={{ color: c.ink, fontSize: 15.5, fontWeight: "700" }}>Профиль заполнен на {comp.pct}%</Text>
            <Text style={{ color: c.muted, fontSize: 12.5 }}>
              {comp.done} из {comp.total}
            </Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: c.surface2, overflow: "hidden" }}>
            <View style={{ width: `${comp.pct}%`, height: "100%", borderRadius: 4, backgroundColor: grad[1] }} />
          </View>
          <Text style={{ color: c.muted, fontSize: 12.5 }}>
            Это видят люди, когда сканируют ваш QR. Полный профиль вызывает больше доверия.
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {comp.todo.map((it) => (
              <Pressable
                key={it.id}
                onPress={() => openItem(it)}
                accessibilityRole="button"
                accessibilityLabel={`Добавить: ${it.label}`}
                style={{ paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: c.surface2 }}
              >
                <Text style={{ color: c.ink, fontSize: 13 }}>
                  <Text style={{ color: c.accentInk }}>+ </Text>
                  {it.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <ProfileView id={profile.id} version={version} afterHeader={ownerControls} />
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
      </ScrollView>
      <QuickAddSheet
        profile={profile}
        target={sheet}
        onClose={() => setSheet(null)}
        onSaved={() => {
          setSheet(null);
          reloadProfile();
          setVersion((v) => v + 1);
        }}
      />
    </SafeAreaView>
  );
}
