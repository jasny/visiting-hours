import { addLocale, locale } from "primereact/api"

export function useDutchLocale() {
  addLocale('nl', {
    firstDayOfWeek: 1, // monday
    dayNames: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
    dayNamesShort: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
    dayNamesMin: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
    monthNames: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
    monthNamesShort: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'],
    today: 'Vandaag',
    clear: 'Wissen'
  });

  locale('nl');
}
