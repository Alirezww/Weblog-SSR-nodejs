const moment = require('jalali-moment');

exports.formateDate = (date) => {
    return moment(date).locale('fa').format('D MMM YYYY')
}