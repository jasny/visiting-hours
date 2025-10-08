import { ToolbarProps } from 'react-big-calendar'
import { Toolbar } from 'primereact/toolbar'
import { Button } from 'primereact/button'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CalendarToolbar(props: ToolbarProps<any, object>) {
  const { onNavigate } = props

  return (
    <Toolbar
      start={
        <div className="flex items-center gap-2">
          <Button icon="pi pi-angle-left" text onClick={() => onNavigate('PREV')} aria-label="Vorige" />
        </div>
      }
      end={
        <div className="flex items-center gap-2">
          <Button text onClick={() => onNavigate('TODAY')}>Vandaag</Button>
          <Button icon="pi pi-angle-right" text onClick={() => onNavigate('NEXT')} aria-label="Volgende" />
        </div>
      }
    />
  )
}
