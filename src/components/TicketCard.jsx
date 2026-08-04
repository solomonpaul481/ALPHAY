export default function TicketCard({ header, children, footer }) {
  return (
    <div className="overflow-hidden rounded-card shadow-lift">
      <div className="ticket-edge-bottom bg-purple px-6 pb-5 pt-6 text-white">{header}</div>
      <div className="ticket-divider bg-white px-6 py-5">{children}</div>
      {footer && <div className="bg-purple-50/60 px-6 py-4">{footer}</div>}
    </div>
  );
}
