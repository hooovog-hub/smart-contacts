// Вход в комнату встречи без приложения. Спецификация: docs/01-product/features/meetings-rooms.md
// TODO(web-engineer): список участников (через серверную функцию с service role), форма «Имя, чем занимаетесь, телефон» → POST /api/rooms/[code]/join
export default function RoomPage({ params }: { params: { code: string } }) {
  return (
    <main style={{ maxWidth: 440, margin: "0 auto", padding: 16 }}>
      <h1>Встреча {params.code}</h1>
      <p style={{ color: "#8E8E93" }}>Войдите, чтобы увидеть участников и сохранить их контакты.</p>
    </main>
  );
}
