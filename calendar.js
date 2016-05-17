(function($, moment) {
    $('.calendar .available').on('click', function() {
        var date = $(this).attr('data-date');
        var time = $(this).attr('data-time');
        
        var modal = $('#calendarModal');
        
        modal.find('input.date').val(date);
        modal.find('input.time').val(time);
        modal.find('span.date').text(moment(date).format('dddd D MMMM'));
        modal.find('span.time').text(time);
        
        modal.modal();
    });
}(jQuery, moment));

(function($) {
  $('.calendar .available').tooltip({
      container: 'html'
  })
}(jQuery));
