(function($) {
    $('input[data-mask]').each(function() {
        var mask = $(this).attr('data-mask');
        $(this).mask(mask);
    });
}(jQuery));

(function($) {
    $('.row-toggle .btn-group input[type=radio]').on('change', function() {
        var toggleClass = $(this).val() === 'yes' ? 'addClass' : 'removeClass';
        
        $(this).closest('.row-toggle')[toggleClass]('on');
        $(this).closest('.row-toggle').find('.col-toggle input').attr('required', $(this).val() === 'yes');
    });
}(jQuery));

(function($) {
    $('form .btn.previous').on('click', function() {
        $(this).closest('form').attr('novalidate', true);
    });
}(jQuery));

(function($, moment) {
    moment.locale('nl');
    
    $('input.date').datetimepicker({
        format: 'DD-MM-YYYY',
        useCurrent: false
    });
    
    $('input.date-from').datetimepicker({
        format: 'DD-MM-YYYY',
        defaultDate: 'now',
        minDate: 'now'
    });
    $('input.date-to').datetimepicker({
        format: 'DD-MM-YYYY',
        minDate: 'now',
        useCurrent: false
    });
    
    $(".date-from").on("dp.change", function (e) {
        $(this).closest('.row').find('.date-to').data("DateTimePicker").minDate(e.date);
    });
    $(".date-to").on("dp.change", function (e) {
        $(this).closest('.row').find('.date-from').data("DateTimePicker").maxDate(e.date);
    });
}(jQuery, moment));

(function($, Clipboard) {
    var clipboard = new Clipboard('.clipboard');

    clipboard.on('success', function(e) {
        $(e.trigger).tooltip('show');
        setTimeout(function() {
            $(e.trigger).tooltip('hide');
        }, 2000);
    });
})(jQuery, Clipboard);
