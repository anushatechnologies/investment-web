export default function NotificationBanner({ message }) {
  return (
    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-sm text-amber-200 backdrop-blur-lg">
      {message}
    </div>
  );
}
