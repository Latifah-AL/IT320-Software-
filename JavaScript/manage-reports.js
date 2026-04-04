const approveButtons =
document.querySelectorAll(".btn-approve");

approveButtons.forEach(button => {

button.onclick =
function () {

alert("تم قبول البلاغ");

};

});

const rejectButtons =
document.querySelectorAll(".btn-reject");

rejectButtons.forEach(button => {

button.onclick =
function () {

alert("تم رفض البلاغ");

};

});