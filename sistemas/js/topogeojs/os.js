document.addEventListener('DOMContentLoaded', function() {
    // 'task-list' sınıfına sahip <ul> elemanını seç
    const taskList = document.querySelector('.task-list');
    
    // <li> elemanlarının sayısını al
    const totalItems = taskList.getElementsByTagName('li').length;
    
    // 'active' sınıfına sahip öğeleri say
    const activeItems = taskList.getElementsByClassName('tab_inactive').length;
	// Pasif görevlerin sayısını al
    const passiveItems = taskList.querySelectorAll('.task-checkbox:checked').length;

    
	// Progress bar ve sonuç gösterme elemanlarını al
    const displayElement = document.getElementById('task-count');
    const progressBar = document.getElementById('task-progress');
	const progressText = document.getElementById('progress-text');
	const progressTextSvg = document.getElementById('progress-text-svg');
    const fgCircle = document.querySelector('.fg-circle');
    
	// Yarım daire çevresi için pi * r hesaplaması (r = 80)
    const radius = 80;
    const circumference = Math.PI * radius; // Yarım daire için çevre
	
    // Başlangıçta sayıyı göster
    const result = `${activeItems} / ${totalItems}`;
    if (displayElement) {
        displayElement.textContent = result;
    }

    // Progress bar'ı güncelle
    updateProgressBar(activeItems, totalItems, circumference);

    // Checkbox tıklamalarını dinle
    const checkboxes = taskList.querySelectorAll('.task-checkbox');
    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            const li = this.closest('li'); // Checkbox'ın ait olduğu <li> öğesini al

            if (this.checked) {
                // Checkbox işaretlendiğinde passive sınıfını ekle
                li.classList.add('tab_inactive');
                li.classList.remove('tab_disabled');
                li.style.textDecoration = 'line-through';
                li.style.color = 'gray';
            } else {
                // Checkbox işaret kaldırıldığında passive sınıfını çıkar
                li.classList.remove('tab_inactive');
                li.classList.add('tab_disabled');
                li.style.textDecoration = 'none';
                li.style.color = 'black'; // Varsayılan renk
            }

            // Güncel aktif öğe sayısını al
            const activeItems = taskList.querySelectorAll('.task-checkbox:not(:checked)').length;
            const passiveItems = taskList.querySelectorAll('.task-checkbox:checked').length;

            // Güncellenmiş sayıyı hesapla
            const result = `${activeItems} / ${totalItems}`;
            if (displayElement) {
                displayElement.textContent = result;
            }

            // Progress bar'ı güncelle
            updateProgressBar(passiveItems, totalItems, circumference);
        });
    });

    // Progress bar'ı güncelleme fonksiyonu
    function updateProgressBar(passiveItems, totalItems, circumference) {
        const percentage = (passiveItems / totalItems) * 100;
        progressBar.value = percentage;
		
		const dashoffset = (1 - percentage / 100) * circumference;
        fgCircle.style.strokeDashoffset = dashoffset;
        
		progressText.textContent = `${Math.round(percentage)}%`;
        // Yüzdeyi daire içinde göster
        progressTextSvg.textContent = `${Math.round(percentage)}%`;
    }
});