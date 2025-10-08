import { ToolbarProps, Navigate } from 'react-big-calendar'
import { Toolbar } from 'primereact/toolbar'
import { Button } from 'primereact/button'
import { ArrowBigLeftIcon, ArrowBigRightIcon, Calendar1Icon } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CalendarToolbar(props: ToolbarProps<any, object>) {
  const { onNavigate, view, label } = props

  return (
    <Toolbar
      start={
        <div className="flex items-center gap-2">
          <Button icon={<ArrowBigLeftIcon />} text onClick={() => onNavigate(Navigate.PREVIOUS)} aria-label="Vorige" />
        </div>
      }
      center={
        view === 'week'
          ? <div className="text-gray-600">{ label.replace(/ .+$/, '')} </div>
          : <div className="text-gray-600">{ label }</div>
      }
      end={
        <div className="flex items-center gap-2">
          <Button icon={<Calendar1Icon />} text onClick={() => onNavigate(Navigate.TODAY)} aria-label="Vandaag" />
          <Button icon={<ArrowBigRightIcon />} text onClick={() => onNavigate(Navigate.NEXT)} aria-label="Volgende" />
        </div>
      }
    />
  )
}
