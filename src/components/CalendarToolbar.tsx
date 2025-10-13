import { ToolbarProps, Navigate } from 'react-big-calendar'
import { Toolbar } from 'primereact/toolbar'
import { Button } from 'primereact/button'
import { ArrowBigLeftIcon, ArrowBigRightIcon, Calendar1Icon } from 'lucide-react'
import { format as dfFormat } from 'date-fns'
import { nl } from 'date-fns/locale'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CalendarToolbar(props: ToolbarProps<any, object>) {
  const { onNavigate, view, label, date } = props

  const centerLabel = (() => {
    if (view === 'week') {
      return label.replace(/ .+$/, '')
    }
    if (view === 'day') {
      // e.g. "wo 16 okt"
      return dfFormat(date as Date, 'EEEEEE d MMM', { locale: nl })
    }
    return label
  })()

  return (
    <Toolbar
      start={
        <div className="flex items-center gap-2">
          <Button icon={<ArrowBigLeftIcon />} text onClick={() => onNavigate(Navigate.PREVIOUS)} aria-label="Vorige" />
        </div>
      }
      center={<div className="text-gray-600">{ centerLabel }</div>}
      end={
        <div className="flex items-center gap-2">
          <Button icon={<Calendar1Icon />} text onClick={() => onNavigate(Navigate.TODAY)} aria-label="Vandaag" />
          <Button icon={<ArrowBigRightIcon />} text onClick={() => onNavigate(Navigate.NEXT)} aria-label="Volgende" />
        </div>
      }
    />
  )
}
