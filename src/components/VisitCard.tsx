import { Card } from "primereact/card"
import { MapPin } from "lucide-react";

function formatEndTime(startHM: string, durationMin: number) {
  const [h, m] = startHM.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  d.setMinutes(d.getMinutes() + durationMin);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function VisitCard(props: {
  onClick: () => void,
  disabled: boolean,
  visit: { date: string; time: string; duration?: number } | null,
  city: string | null,
  street: string | null,
  postalcode: string | null,
}) {
  const hasAddress = !!props.street;
  return <Card
    className="shadow-sm text-center"
    title={<span className="font-bold">Jouw afspraak</span>}
    footer={
      <div className="flex justify-end">
        <button type="button" className="p-button p-button-text" onClick={props.onClick} disabled={props.disabled}>
          Afspraak annuleren
        </button>
      </div>
    }
  >
    <div
      className={
        hasAddress
          ? "flex flex-col md:flex-row items-stretch md:divide-x divide-y md:divide-y-0 divide-gray-200"
          : "flex flex-col items-center"
      }
    >
      <div className={hasAddress ? "flex-1 md:basis-1/2 px-6 py-4 flex flex-col items-center justify-center text-center" : "text-center min-w-[120px] mx-auto py-2"}>
        <div
          className="uppercase">{new Date(`${props.visit!.date}T00:00:00`).toLocaleDateString("nl-NL", { weekday: "short" })}</div>
        <div className="font-bold text-4xl leading-tight">{new Date(`${props.visit!.date}T00:00:00`).getDate()}</div>
        <div>{new Date(`${props.visit!.date}T00:00:00`).toLocaleDateString("nl-NL", { month: "long" })}</div>
        <div className="mt-2 font-bold">
          {props.visit!.time} - {formatEndTime(props.visit!.time, props.visit!.duration!)}
        </div>
      </div>
      {hasAddress && (
        <div className="flex-1 md:basis-1/2 px-6 py-4 md:text-left text-center">
          <div className="font-bold">{props.city}</div>
          <div>{props.street}</div>
          <div>{props.postalcode}</div>
          <div className="mt-4">
            <a className="text-rose-400" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.street!)}+${encodeURIComponent(props.city!)}`} target="_blank">
              <small><MapPin style={{ display: 'inline-block'}} /> &mdash; Open in Google Maps</small>
            </a>
          </div>
        </div>
      )}
    </div>
  </Card>
}
