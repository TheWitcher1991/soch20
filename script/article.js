'use strict';

document.addEventListener('', function () {

    const self = (el) => document.querySelector(el);

    const formatDate = (date) => {
        let dd = date.getDate(),
            mm = date.getMonth() + 1,
            yy = date.getFullYear() % 100;

        dd < 10 ? dd = `0${dd}` : '0';
        mm < 10 ? mm = `0${mm}` : '0';
        yy < 10 ? yy = `0${yy}` : '0';

        return `${dd}.${mm}.${yy}`;
    }

    const Article = ({ row, title, text, date, titleImg, id }) => {
        row = self(row);

        try {

            row.innerHTML += `
                <div class="row-${id} lenta__row">
                    <div class="row__logo">
                        <a href="./templates/article.html?id=${id}"><i class="far fa-newspaper"></i> ${title} - <time>${date}</time></a>
                    </div>
                    <div class="row__content flex">
                        <div class="flex-1">
                            <span>
                                <img src="${titleImg}" alt="">
                            </span>
                        </div>
                        <div class="flex-2">
                            <div class="text">
                                ${text}
                            </div>
                            <a href="./templates/article.html?id=${id}" class="bth">Подробнее</a>
                        </div>
                    </div>
                </div>
            `

            /* Запрос...
            $.ajax({
                ...
            }); 
            */

        } catch (e) {
            throw new Error(e);
        }
    }

    self('.createArticle').addEventListener('click', (e) => {
        e.preventDefault();

        const content = {
            row: self('#').value,
            title: self('#').value,
            text: self('#').value,
            date: formatDate(new Date()),
            titleImg: self('#').value,
            id: self('#').value,
        }

        Article(content);
    });

});