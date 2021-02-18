'use strict';

$(function () {

    $(window).scroll(() => {
        let height = $(window).scrollTop();

        if (height > 150) {
            $('.header__container-2').addClass('h-container-active');
            $('#arrow__up').fadeIn();
        } else {
            $('.header__container-2').removeClass('h-container-active');
            $('#arrow__up').fadeOut();
        }
    });

    $('#arrow__up').on('click', (e) => {
        e.preventDefault();

        $('html, body').animate({
            scrollTop: 0
        }, 500);

        return false;
    });

    $('.header__nav .header__menu > ul > li > a.home').addClass('active');

});