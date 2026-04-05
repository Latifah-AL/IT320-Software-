document.addEventListener('DOMContentLoaded', function () {

    // Location detect
    var detectBtn     = document.querySelector('.btn-detect');
    var locationInput = document.getElementById('location');

    if (detectBtn && locationInput) {
        detectBtn.addEventListener('click', function () {
            if (!navigator.geolocation) { alert('المتصفح لا يدعم تحديد الموقع'); return; }
            detectBtn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> جاري التحديد...';
            detectBtn.disabled  = true;
            navigator.geolocation.getCurrentPosition(
                function (pos) {
                    var lat = pos.coords.latitude;
                    var lng = pos.coords.longitude;
                    fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lng + '&format=json&accept-language=ar')
                    .then(function (res) { return res.json(); })
                    .then(function (data) {
                        var a = data.address;
                        var readable = '';
                        if (a.neighbourhood) readable += a.neighbourhood + '، ';
                        if (a.road)          readable += a.road + '، ';
                        if (a.city)          readable += a.city;
                        else if (a.state)    readable += a.state;
                        locationInput.value = readable || data.display_name;
                    })
                    .catch(function () { locationInput.value = lat + ', ' + lng; });
                    detectBtn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> تحديد تلقائي';
                    detectBtn.disabled  = false;
                },
                function (error) {
                    if (error.code === 1)      alert('تم رفض إذن الموقع');
                    else if (error.code === 2) alert('تعذّر تحديد الموقع');
                    else if (error.code === 3) alert('انتهت مهلة التحديد');
                    detectBtn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> تحديد تلقائي';
                    detectBtn.disabled  = false;
                },
                { timeout: 10000, maximumAge: 0, enableHighAccuracy: false }
            );
        });
    }

    // Image preview
    var imageInput   = document.getElementById('imageInput');
    var uploadArea   = document.querySelector('.upload-area');
    var imageDataUrl = null;

    if (imageInput && uploadArea) {
        imageInput.addEventListener('change', function () {
            var file = this.files[0];
            if (!file) return;

            var allowed = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowed.includes(file.type)) {
                alert('صيغة الملف غير مدعومة. يرجى رفع صورة بصيغة JPG أو PNG فقط');
                this.value = '';
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert('حجم الصورة كبير جداً. الحد الأقصى 5MB');
                this.value = '';
                return;
            }

            var reader = new FileReader();
            reader.onload = function (e) {
                imageDataUrl = e.target.result;
                uploadArea.innerHTML = '<img src="' + imageDataUrl + '" style="width:100%;height:180px;object-fit:cover;border-radius:8px;"/>';
            };
            reader.readAsDataURL(file);
        });
    }

    // Form submit
    var form = document.getElementById('createReportForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Validation
            var title       = document.getElementById('title').value.trim();
            var category    = document.getElementById('category').value;
            var description = document.getElementById('description').value.trim();
            var location    = document.getElementById('location').value.trim();
            var datetime    = document.getElementById('datetime').value;

            if (!title) {
                showError('title', 'يرجى إدخال عنوان البلاغ');
                return;
            }
            if (!category) {
                showError('category', 'يرجى اختيار نوع المخالفة');
                return;
            }
            if (!description) {
                showError('description', 'يرجى إدخال وصف المخالفة');
                return;
            }
            if (!imageDataUrl) {
                var uploadAreaEl = document.querySelector('.upload-area');
                uploadAreaEl.style.borderColor = '#C62828';
                var existing = uploadAreaEl.querySelector('.validation-msg');
                if (existing) existing.remove();
                var msg = document.createElement('span');
                msg.className   = 'validation-msg';
                msg.textContent = 'يرجى إرفاق صورة للمخالفة';
                msg.style.cssText = 'display:block;font-size:0.78rem;color:#C62828;margin-top:0.3rem;';
                uploadAreaEl.parentElement.appendChild(msg);
                uploadAreaEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            if (!location) {
                showError('location', 'يرجى إدخال الموقع');
                return;
            }
            if (!datetime) {
                showError('datetime', 'يرجى إدخال تاريخ ووقت المخالفة');
                return;
            }

            // Save
            var cat = categoryMap[category] || categoryMap['other'];

            var report = {
                id:            generateId(),
                title:         title,
                category:      cat.label,
                categoryIcon:  cat.icon,
                categoryValue: category,
                status:        'pending',
                statusLabel:   'قيد الانتظار',
                location:      location,
                datetime:      datetime,
                date:          formatDate(datetime),
                description:   description,
                image:         imageDataUrl
            };

            saveReport(report);
            document.getElementById('successMessage').textContent = 'تم إرسال البلاغ بنجاح برقم ' + report.id;
            document.getElementById('successModal').style.display = 'flex';
        });
    }

});

// Validation helper
function showError(fieldId, message) {
    var field = document.getElementById(fieldId);
    field.style.borderColor = '#C62828';

    var existing = field.parentElement.querySelector('.validation-msg');
    if (existing) existing.remove();

    var msg = document.createElement('span');
    msg.className   = 'validation-msg';
    msg.textContent = message;
    msg.style.cssText = 'display:block;font-size:0.78rem;color:#C62828;margin-top:0.3rem;';
    field.parentElement.appendChild(msg);

    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.focus();

    field.addEventListener('input', function () {
        field.style.borderColor = '';
        var m = field.parentElement.querySelector('.validation-msg');
        if (m) m.remove();
    }, { once: true });
}