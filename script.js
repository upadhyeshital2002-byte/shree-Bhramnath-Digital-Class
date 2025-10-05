// Global variables
let students = [];
let teachers = [];
let classes = [];
let attendance = [];
let exams = [];
let fees = [];
let feePayments = [];
let notices = [];
let books = [];
let routes = [];
let currentDate = new Date().toISOString().split('T')[0];
// Temporarily stored contacts parsed from uploaded file
let uploadedContacts = [];
// RBAC config
// RBAC experimental config removed

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!checkAuth()) {
        window.location.href = 'login.html';
        return;
    }
    
    // Display user info
    displayUserInfo();
    
    // Initialize app
    initializeApp();
    loadSampleData();
    loadRBACConfig();
    updateDashboard();
    document.getElementById('attendance-date').value = currentDate;
    
    // Check user permissions
    checkUserPermissions();

    // If navigated to a specific module via query (?module=teachers or ?module=profile etc.), open it
    const params = new URLSearchParams(window.location.search);
    const gotoModule = params.get('module');
    if (gotoModule) {
        // Show requested module and perform any module-specific initialization
        showModule(gotoModule);
        switch (gotoModule) {
            case 'profile':
                loadProfileOverview();
                loadProfileEditForm();
                break;
            case 'teachers':
                loadTeachers();
                break;
            case 'students':
                loadStudents();
                break;
            case 'classes':
                loadClasses();
                populateClassSelects();
                break;
            case 'exams':
                loadExams();
                populateExamSelects();
                break;
            case 'fees':
                loadFees();
                loadFeePayments();
                populateFeeSelects();
                populateStudentSelects();
                break;
            // add other modules if needed
        }
    }
});

// Initialize application
function initializeApp() {
    // Set up navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const module = this.getAttribute('data-module');
            showModule(module);
        });
    });
    
    // Initialize tabs
    initializeTabs();
    
    // Load initial data
    loadStudents();
    loadTeachers();
    loadClasses();
    loadExams();
    loadFees();
    loadFeePayments();
    // Setup student form auto-roll behavior
    setupStudentFormAutoRoll();
    // Setup notice contacts file input listener
    const contactsFileInput = document.getElementById('notice-contacts-file');
    if (contactsFileInput) {
        contactsFileInput.addEventListener('change', handleContactsFileUpload);
    }
    // Removed: communication, library, transport initialization
}

function setupStudentFormAutoRoll() {
    const classEl = document.getElementById('student-class');
    const sectionEl = document.getElementById('student-section');
    const rollEl = document.getElementById('student-roll');

    function updateRoll() {
        if (!classEl) return;
        const className = classEl.value;
        const section = sectionEl ? sectionEl.value : '';
        if (!rollEl) return;
        // Only populate if user hasn't entered a roll
        if (!rollEl.value || rollEl.value.trim() === '') {
            const next = getNextRollForClass(className, section);
            if (next) rollEl.value = next;
        }
    }

    if (classEl) classEl.addEventListener('change', updateRoll);
    if (sectionEl) sectionEl.addEventListener('change', updateRoll);

    // When the add-student modal is opened, compute roll if empty
    const addStudentBtn = document.querySelector('[onclick="showAddStudentForm()"]');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            setTimeout(updateRoll, 50); // wait a tick for modal inputs to be ready
        });
    }
}

// Navigation functions
function showModule(moduleName) {
    const overlay = document.getElementById('app-loading');
    if (overlay) overlay.style.display = 'flex';
    // Yield to paint
    setTimeout(() => {
        try {
            // Hide all modules
            const modulesEls = document.querySelectorAll('.module');
            modulesEls.forEach(m => m.classList.remove('active'));
            // Show selected module
            const target = document.getElementById(moduleName);
            if (target) target.classList.add('active');
            // Update navigation
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-module') === moduleName) link.classList.add('active');
            });
            // Module-specific initialization
            switch(moduleName) {
            case 'dashboard':
                updateDashboard();
                break;
            case 'profile':
                loadProfileOverview();
                break;
            case 'students':
                loadStudents();
                break;
            case 'classes':
                loadClasses();
                populateClassSelects();
                break;
            case 'attendance':
                populateClassSelects();
                break;
            case 'exams':
                loadExams();
                populateExamSelects();
                break;
            case 'fees':
                loadFees();
                loadFeePayments();
                populateFeeSelects();
                populateStudentSelects();
                break;
            case 'notices':
                loadNotices();
                break;
            case 'teachers':
                loadTeachers();
                break;
            // removed modules
            }
        } finally {
            if (overlay) overlay.style.display = 'none';
        }
    }, 0);
}

// Tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        // Avoid double-binding: skip if inline onclick already present
        if (btn.hasAttribute('onclick')) return;
        btn.addEventListener('click', function() {
            const tabName = this.textContent.toLowerCase().replace(/\s+/g, '-') + '-tab';
            showTab(tabName, this);
        });
    });
}

function showTab(tabId, activeButton) {
    // Remove active class from all tab buttons in the same tab group
    const tabGroup = activeButton.closest('.tabs').parentElement;
    const tabButtons = tabGroup.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    activeButton.classList.add('active');
    
    // Hide all tab contents in the same group
    const tabContents = tabGroup.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Show selected tab content
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Profile-specific refresh
    if (tabId === 'profile-overview-tab') {
        loadProfileOverview();
    } else if (tabId === 'profile-edit-tab') {
        loadProfileEditForm();
    }
}

// Restore profile view state if we temporarily modified it while viewing a teacher
function restoreProfileViewState() {
    const headerActions = document.querySelector('#profile .header-actions');
    if (!headerActions) return;
    if (headerActions.dataset.prevDisplay !== undefined) {
        headerActions.style.display = headerActions.dataset.prevDisplay;
        delete headerActions.dataset.prevDisplay;
    }
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Student Management Functions
function showAddStudentForm() {
    showModal('add-student-modal');
}

function addStudent(event) {
    event.preventDefault();
    const studentName = (document.getElementById('student-name') || {}).value || '';
    const admissionDateVal = document.getElementById('admission-date').value || currentDate;

    // If roll not provided, auto-generate next roll for the class+section
    const classNameForRoll = document.getElementById('student-class').value;
    const sectionForRoll = document.getElementById('student-section').value;
    const providedRoll = (document.getElementById('student-roll') || {}).value;

    let computedRoll = providedRoll && providedRoll.trim() ? providedRoll.trim() : getNextRollForClass(classNameForRoll, sectionForRoll);

    // Ensure roll uniqueness within class+section
    (function ensureUniqueRoll() {
        const existing = students || loadData('students') || [];
        const sameGroup = (r) => existing.find(s => s.class === classNameForRoll && (sectionForRoll ? s.section === sectionForRoll : true) && String(s.roll) === String(r));
        if (!computedRoll) return;

        // If roll is purely numeric (or numeric when stripped), increment until unique
        const numericPart = String(computedRoll).replace(/[^0-9]/g, '');
        if (numericPart && numericPart.length > 0) {
            let num = parseInt(numericPart, 10) || 0;
            let candidate = computedRoll;
            let tries = 0;
            while (sameGroup(candidate) && tries < 10000) {
                num++;
                candidate = String(num);
                tries++;
            }
            computedRoll = candidate;
            return;
        }

        // Non-numeric roll: append sequence -001, -002 etc.
        let seq = 1;
        let base = String(computedRoll);
        let candidate = base;
        while (sameGroup(candidate) && seq < 10000) {
            const seqStr = String(seq).padStart(3, '0');
            candidate = `${base}-${seqStr}`;
            seq++;
        }
        computedRoll = candidate;
    })();

    const studentData = {
        id: generateStudentIdFromName(studentName, admissionDateVal),
        name: studentName,
        class: document.getElementById('student-class').value,
        section: document.getElementById('student-section').value,
        roll: computedRoll,
        dob: document.getElementById('student-dob').value,
        gender: document.getElementById('student-gender').value,
        address: document.getElementById('student-address').value,
        guardianName: document.getElementById('guardian-name').value,
        guardianRelation: document.getElementById('guardian-relation').value,
        guardianPhone: document.getElementById('guardian-phone').value,
        guardianEmail: document.getElementById('guardian-email').value,
        previousSchool: document.getElementById('previous-school').value,
        admissionDate: admissionDateVal,
        status: 'Active'
    };
    
    students.push(studentData);
    saveData('students', students);
    loadStudents();
    updateDashboard();
    closeModal('add-student-modal');
    showAlert('Student added successfully!', 'success');
    
    // Reset form
    document.getElementById('add-student-form').reset();
}

/**
 * Compute next roll number for a given class and section.
 * Rolls are numeric strings. This finds the max existing roll for the class+section and returns +1.
 * If no existing rolls, returns '1' (or '01' if you prefer padding).
 */
function getNextRollForClass(className, section) {
    if (!className) return '';
    const existing = students || loadData('students') || [];
    // Filter students for same class and (if section provided) same section
    const filtered = existing.filter(s => s.class === className && (section ? s.section === section : true));
    // Extract numeric parts of roll if possible, otherwise ignore non-numeric
    let maxRoll = 0;
    filtered.forEach(s => {
        const r = s.roll || s.id || '';
        const num = parseInt(String(r).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num) && num > maxRoll) maxRoll = num;
    });
    const next = maxRoll + 1;
    return String(next);
}

function loadStudents() {
    const tbody = document.getElementById('students-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    const batch = 50;
    let index = 0;
    function renderChunk() {
        const frag = document.createDocumentFragment();
        const end = Math.min(index + batch, students.length);
        for (let i = index; i < end; i++) {
            const student = students[i];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.class} ${student.section}</td>
                <td>${student.guardianName}</td>
                <td>${student.guardianPhone}</td>
                <td><span class="status-badge status-present">${student.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editStudent('${student.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            frag.appendChild(row);
        }
        tbody.appendChild(frag);
        index = end;
        if (index < students.length) setTimeout(renderChunk, 0);
    }
    renderChunk();
}

function searchStudents() {
    debounceSearchStudents();
}

// Debounce for smoother typing
let searchStudentsTimer;
function debounceSearchStudents() {
    clearTimeout(searchStudentsTimer);
    searchStudentsTimer = setTimeout(() => {
        const searchTerm = (document.getElementById('student-search') || { value: '' }).value.toLowerCase();
        const rows = document.querySelectorAll('#students-tbody tr');
        const batch = 50; // process rows in chunks to avoid blocking
        let index = 0;
        function processChunk() {
            const end = Math.min(index + batch, rows.length);
            for (let i = index; i < end; i++) {
                const row = rows[i];
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            }
            index = end;
            if (index < rows.length) {
                setTimeout(processChunk, 0);
            }
        }
        processChunk();
    }, 150);
}

function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (student) {
        // Populate form with student data
        Object.keys(student).forEach(key => {
            const element = document.getElementById(`student-${key}`);
            if (element) {
                element.value = student[key];
            }
        });
        showModal('add-student-modal');
    }
}

function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        students = students.filter(s => s.id !== studentId);
        saveData('students', students);
        loadStudents();
        updateDashboard();
        showAlert('Student deleted successfully!', 'success');
    }
}

// Class Management Functions
function showAddClassForm() {
    populateClassTeacherSelect();
    showModal('add-class-modal');
}

function populateClassTeacherSelect() {
    const teacherSelect = document.getElementById('class-teacher');
    if (!teacherSelect) return;
    
    teacherSelect.innerHTML = '<option value="">Select Class Teacher</option>';
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = teacher.name;
        teacherSelect.appendChild(option);
    });
}

function updateClassDetails() {
    const className = document.getElementById('class-name').value;
    const roomInput = document.getElementById('class-room');
    
    if (className && roomInput) {
        // Auto-suggest room number based on class
        if (className === 'Nursery' || className === 'LKG' || className === 'UKG') {
            roomInput.placeholder = 'e.g., KG-101';
        } else if (className === '1' || className === '2' || className === '3') {
            roomInput.placeholder = 'e.g., Primary-101';
        } else if (className === '4' || className === '5') {
            roomInput.placeholder = 'e.g., Primary-201';
        } else {
            roomInput.placeholder = 'e.g., Secondary-301';
        }
    }
}

function addClass(event) {
    event.preventDefault();
    
    const className = document.getElementById('class-name').value;
    const section = document.getElementById('class-section').value;
    const teacherId = document.getElementById('class-teacher').value;
    const room = document.getElementById('class-room').value;
    const strength = parseInt(document.getElementById('class-strength').value) || 40;
    const floor = document.getElementById('class-floor').value;
    const startTime = document.getElementById('class-start-time').value;
    const endTime = document.getElementById('class-end-time').value;
    const description = document.getElementById('class-description').value;
    
    // Get selected subjects
    const subjectCheckboxes = document.querySelectorAll('.subject-checkbox:checked');
    const subjects = Array.from(subjectCheckboxes).map(cb => cb.value);
    
    if (!className || !section || !teacherId || !room) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    // Check if class-section combination already exists
    const existingClass = classes.find(c => c.name === className && c.section === section);
    if (existingClass) {
        showAlert('This class-section combination already exists!', 'error');
        return;
    }
    
    const teacher = teachers.find(t => t.id === teacherId);
    const teacherName = teacher ? teacher.name : 'Unknown Teacher';
    
    const classData = {
        id: generateId(),
        name: className,
        section: section,
        teacherId: teacherId,
        teacherName: teacherName,
        room: room,
        floor: floor || 'Ground Floor',
        maxStrength: strength,
        currentStudents: 0,
        startTime: startTime,
        endTime: endTime,
        subjects: subjects,
        description: description,
        status: 'Active',
        createdAt: new Date().toISOString()
    };
    
    classes.push(classData);
    saveData('classes', classes);
    loadClasses();
    closeModal('add-class-modal');
    showAlert(`Class ${className} ${section} added successfully!`, 'success');
    
    // Reset form
    document.getElementById('add-class-form').reset();
    document.getElementById('class-strength').value = 40;
    document.getElementById('class-start-time').value = '08:00';
    document.getElementById('class-end-time').value = '14:00';
    
    // Uncheck all subject checkboxes
    document.querySelectorAll('.subject-checkbox').forEach(cb => cb.checked = false);
}

function loadClasses() {
    const tbody = document.getElementById('classes-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // If no classes exist, show message
    if (classes.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 2rem; color: #6c757d;">
                <i class="fas fa-chalkboard-teacher" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                No classes found. Click "Add New Class" to create your first class.
            </td>
        `;
        tbody.appendChild(row);
        return;
    }
    
    const renderList = [...classes];
    let idx = 0;
    const chunk = 30;
    function renderNext() {
        const end = Math.min(idx + chunk, renderList.length);
        const frag = document.createDocumentFragment();
        for (let j = idx; j < end; j++) {
            const classData = renderList[j];
        // Count current students in this class
        const currentStudents = students.filter(s => s.class === classData.name && s.section === classData.section).length;
        
        // Update current student count
        classData.currentStudents = currentStudents;
        
        const subjectsText = classData.subjects.length > 0 ? classData.subjects.join(', ') : 'No subjects assigned';
        const subjectsDisplay = subjectsText.length > 50 ? subjectsText.substring(0, 50) + '...' : subjectsText;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="class-info">
                    <div class="class-name">${classData.name} ${classData.section}</div>
                    <div class="class-details">Max: ${classData.maxStrength} students</div>
                </div>
            </td>
            <td>
                <div class="class-info">
                    <div>${classData.teacherName}</div>
                    <div class="class-details">${classData.status}</div>
                </div>
            </td>
            <td>
                <div class="class-info">
                    <div>${classData.room}</div>
                    <div class="class-details">${classData.floor}</div>
                </div>
            </td>
            <td>
                <div class="class-stats">
                    <div class="stats-item">
                        <div class="stats-number">${currentStudents}</div>
                        <div class="stats-label">Current</div>
                    </div>
                    <div class="stats-item">
                        <div class="stats-number">${classData.maxStrength}</div>
                        <div class="stats-label">Max</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="class-info">
                    <div>${classData.startTime} - ${classData.endTime}</div>
                </div>
            </td>
            <td>
                <div title="${subjectsText}">${subjectsDisplay}</div>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewClass('${classData.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-secondary" onclick="editClass('${classData.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteClass('${classData.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
            tbody.appendChild(row);
        }
        idx = end;
        if (idx < renderList.length) setTimeout(renderNext, 0);
    }
    renderNext();
}

function viewClass(classId) {
    // Navigate to dedicated class profile page
    window.location.href = `class.html?id=${encodeURIComponent(classId)}`;
}

function editClass(classId) {
    const classData = classes.find(c => c.id === classId);
    if (!classData) return;
    
    // Populate form with class data
    document.getElementById('class-name').value = classData.name;
    document.getElementById('class-section').value = classData.section;
    document.getElementById('class-teacher').value = classData.teacherId;
    document.getElementById('class-room').value = classData.room;
    document.getElementById('class-strength').value = classData.maxStrength;
    document.getElementById('class-floor').value = classData.floor;
    document.getElementById('class-start-time').value = classData.startTime;
    document.getElementById('class-end-time').value = classData.endTime;
    document.getElementById('class-description').value = classData.description || '';
    
    // Check selected subjects
    document.querySelectorAll('.subject-checkbox').forEach(cb => {
        cb.checked = classData.subjects.includes(cb.value);
    });
    
    showModal('add-class-modal');
}

function deleteClass(classId) {
    const classData = classes.find(c => c.id === classId);
    if (!classData) return;
    
    const currentStudents = students.filter(s => s.class === classData.name && s.section === classData.section);
    
    if (currentStudents.length > 0) {
        showAlert(`Cannot delete class. ${currentStudents.length} students are still enrolled in this class.`, 'warning');
        return;
    }
    
    if (confirm(`Are you sure you want to delete Class ${classData.name} ${classData.section}?`)) {
        classes = classes.filter(c => c.id !== classId);
        saveData('classes', classes);
        loadClasses();
        showAlert('Class deleted successfully!', 'success');
    }
}

function loadTimetable() {
    const classSelect = document.getElementById('class-select');
    const timetableGrid = document.getElementById('timetable-grid');
    
    if (!classSelect || !timetableGrid) return;
    
    const selectedClass = classSelect.value;
    if (!selectedClass) return;
    
    // Find the selected class data
    const classData = classes.find(c => `${c.name}${c.section}` === selectedClass);
    if (!classData) return;
    
    // Generate timetable based on class subjects
    const periods = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8'];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const subjects = classData.subjects.length > 0 ? classData.subjects : ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'];
    
    // Add breaks and lunch
    const allPeriods = [...periods.slice(0, 4), 'Break', ...periods.slice(4, 6), 'Lunch', ...periods.slice(6)];
    
    timetableGrid.innerHTML = '';
    
    // Header row
    const headerRow = document.createElement('div');
    headerRow.className = 'timetable-cell header';
    headerRow.textContent = 'Time';
    timetableGrid.appendChild(headerRow);
    
    days.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'timetable-cell header';
        cell.textContent = day;
        timetableGrid.appendChild(cell);
    });
    
    // Time slots
    allPeriods.forEach((period, index) => {
        let timeText = '';
        let cellClass = 'timetable-cell';
        let subjectText = '';
        
        if (period === 'Break') {
            timeText = '10:30 AM';
            cellClass += ' break';
            subjectText = 'Break';
        } else if (period === 'Lunch') {
            timeText = '12:30 PM';
            cellClass += ' lunch';
            subjectText = 'Lunch';
        } else {
            timeText = `${8 + index}:00 AM`;
            subjectText = subjects[index % subjects.length];
            cellClass += ' subject';
        }
        
        const timeCell = document.createElement('div');
        timeCell.className = 'timetable-cell time';
        timeCell.textContent = timeText;
        timetableGrid.appendChild(timeCell);
        
        days.forEach(day => {
            const subjectCell = document.createElement('div');
            subjectCell.className = cellClass;
            subjectCell.textContent = subjectText;
            if (period !== 'Break' && period !== 'Lunch') {
                subjectCell.title = `Click to edit ${subjectText} for ${day}`;
            }
            timetableGrid.appendChild(subjectCell);
        });
    });
    
    // Add class info header
    const classInfoHeader = document.createElement('div');
    classInfoHeader.style.gridColumn = '1 / -1';
    classInfoHeader.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
    classInfoHeader.style.color = 'white';
    classInfoHeader.style.padding = '1rem';
    classInfoHeader.style.textAlign = 'center';
    classInfoHeader.style.fontWeight = 'bold';
    classInfoHeader.innerHTML = `
        <div>Class ${classData.name} ${classData.section} Timetable</div>
        <div style="font-size: 0.9rem; font-weight: normal; margin-top: 0.5rem;">
            Class Teacher: ${classData.teacherName} | Room: ${classData.room} | Floor: ${classData.floor}
        </div>
    `;
    timetableGrid.insertBefore(classInfoHeader, timetableGrid.firstChild);
}

function showAddTimetableForm() {
    showAlert('Add Timetable functionality will be implemented', 'info');
}

// Attendance Functions
function populateClassSelects() {
    const classSelects = document.querySelectorAll('#attendance-class, #results-class, #fee-class, #class-select');
    const sectionSelects = document.querySelectorAll('#attendance-section');
    
    // Use classes data if available, otherwise fall back to students data
    let classOptions = [];
    
    if (classes.length > 0) {
        // Use defined classes
        classOptions = classes.map(c => ({
            value: `${c.name}${c.section}`,
            text: `${c.name} ${c.section}`,
            class: c.name,
            section: c.section
        }));
    } else {
        // Fall back to student classes
        const uniqueClasses = [...new Set(students.map(s => s.class))].sort();
        classOptions = uniqueClasses.map(cls => ({
            value: cls,
            text: cls,
            class: cls,
            section: ''
        }));
    }
    
    classSelects.forEach(select => {
        select.innerHTML = '<option value="">Select Class</option>';
        classOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            select.appendChild(optionElement);
        });
    });
    
    // Populate sections
    sectionSelects.forEach(select => {
        select.innerHTML = '<option value="">Select Section</option>';
        const uniqueSections = [...new Set(students.map(s => s.section))].sort();
        uniqueSections.forEach(section => {
            const option = document.createElement('option');
            option.value = section;
            option.textContent = section;
            select.appendChild(option);
        });
    });
}

function loadAttendanceStudents() {
    const classSelect = document.getElementById('attendance-class');
    const sectionSelect = document.getElementById('attendance-section');
    const dateSelect = document.getElementById('attendance-date');
    const tbody = document.getElementById('attendance-tbody');
    
    if (!classSelect || !tbody) return;
    
    const selectedClass = classSelect.value;
    const selectedSection = sectionSelect.value;
    const selectedDate = dateSelect.value;
    
    if (!selectedClass || !selectedDate) return;
    
    // Filter students by class and section
    let filteredStudents = students.filter(s => s.class === selectedClass);
    if (selectedSection) {
        filteredStudents = filteredStudents.filter(s => s.section === selectedSection);
    }
    
    tbody.innerHTML = '';
    
    filteredStudents.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.roll || student.id}</td>
            <td>${student.name}</td>
            <td>
                <select class="attendance-status" data-student-id="${student.id}">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-success" onclick="saveAttendance('${student.id}', '${selectedDate}')">
                    <i class="fas fa-save"></i> Save
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function markAttendance() {
    const classSelect = document.getElementById('attendance-class');
    const dateSelect = document.getElementById('attendance-date');
    
    if (!classSelect.value || !dateSelect.value) {
        showAlert('Please select class and date', 'warning');
        return;
    }
    
    loadAttendanceStudents();
}

function saveAttendance(studentId, date) {
    const statusSelect = document.querySelector(`[data-student-id="${studentId}"]`);
    const status = statusSelect.value;
    
    const attendanceRecord = {
        studentId,
        date,
        status,
        timestamp: new Date().toISOString()
    };
    
    attendance.push(attendanceRecord);
    saveData('attendance', attendance);
    showAlert('Attendance saved successfully!', 'success');
}

// Exam Management Functions
function showAddExamForm() {
    populateExamClassSelect();
    document.getElementById('exam-date').value = currentDate;
    showModal('add-exam-modal');
}

function populateExamClassSelect() {
    const classSelect = document.getElementById('exam-class');
    if (!classSelect) return;
    
    classSelect.innerHTML = '<option value="">Select Class</option>';
    
    // Use classes data if available, otherwise fall back to students data
    if (classes.length > 0) {
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = `${cls.name}${cls.section}`;
            option.textContent = `${cls.name} ${cls.section}`;
            classSelect.appendChild(option);
        });
    } else {
        const uniqueClasses = [...new Set(students.map(s => s.class))].sort();
        uniqueClasses.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls;
            option.textContent = cls;
            classSelect.appendChild(option);
        });
    }
}

function loadClassSubjects() {
    const classSelect = document.getElementById('exam-class');
    const subjectSelect = document.getElementById('exam-subject');
    
    if (!classSelect || !subjectSelect) return;
    
    const selectedClass = classSelect.value;
    if (!selectedClass) {
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';
        return;
    }
    
    // Find class data
    let classData = null;
    if (classes.length > 0) {
        classData = classes.find(c => `${c.name}${c.section}` === selectedClass);
    }
    
    let subjects = [];
    if (classData && classData.subjects.length > 0) {
        subjects = classData.subjects;
    } else {
        // Default subjects based on class level
        if (selectedClass.includes('1') || selectedClass.includes('2') || selectedClass.includes('3')) {
            subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'];
        } else if (selectedClass.includes('4') || selectedClass.includes('5')) {
            subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Environmental Studies'];
        } else if (selectedClass.includes('6') || selectedClass.includes('7') || selectedClass.includes('8')) {
            subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science'];
        } else {
            subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Physics', 'Chemistry', 'Biology', 'Computer Science'];
        }
    }
    
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });
}

function addExam(event) {
    event.preventDefault();
    
    const examName = document.getElementById('exam-name').value;
    const examType = document.getElementById('exam-type').value;
    const examClass = document.getElementById('exam-class').value;
    const examSubject = document.getElementById('exam-subject').value;
    const examDate = document.getElementById('exam-date').value;
    const examTime = document.getElementById('exam-time').value;
    const examDuration = parseInt(document.getElementById('exam-duration').value) || 120;
    const examTotalMarks = parseInt(document.getElementById('exam-total-marks').value);
    const examPassMarks = parseInt(document.getElementById('exam-pass-marks').value) || Math.ceil(examTotalMarks * 0.33);
    const examRoom = document.getElementById('exam-room').value;
    const examSyllabus = document.getElementById('exam-syllabus').value;
    const examInstructions = document.getElementById('exam-instructions').value;
    const examStatus = document.getElementById('exam-status').value;
    const examWeightage = parseInt(document.getElementById('exam-weightage').value) || 20;
    
    if (!examName || !examType || !examClass || !examSubject || !examDate || !examTotalMarks) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    const examData = {
        id: generateId(),
        name: examName,
        type: examType,
        class: examClass,
        subject: examSubject,
        date: examDate,
        time: examTime,
        duration: examDuration,
        totalMarks: examTotalMarks,
        passMarks: examPassMarks,
        room: examRoom,
        syllabus: examSyllabus,
        instructions: examInstructions,
        status: examStatus,
        weightage: examWeightage,
        createdAt: new Date().toISOString()
    };
    
    exams.push(examData);
    saveData('exams', exams);
    loadExams();
    closeModal('add-exam-modal');
    showAlert(`Exam "${examName}" added successfully!`, 'success');
    
    // Reset form
    document.getElementById('add-exam-form').reset();
    document.getElementById('exam-time').value = '09:00';
    document.getElementById('exam-duration').value = 120;
}

function loadExams() {
    const tbody = document.getElementById('exams-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // If no exams exist, show message
    if (exams.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" style="text-align: center; padding: 2rem; color: #6c757d;">
                <i class="fas fa-file-alt" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                No exams found. Click "Add Exam" to create your first exam.
            </td>
        `;
        tbody.appendChild(row);
        return;
    }
    
    exams.forEach(exam => {
        const statusBadge = getStatusBadge(exam.status);
        const dateTime = `${formatDate(exam.date)}${exam.time ? ' at ' + exam.time : ''}`;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="class-info">
                    <div class="class-name">${exam.name}</div>
                    <div class="class-details">${exam.duration} min • ${exam.room || 'TBA'}</div>
                </div>
            </td>
            <td><span class="status-badge status-present">${exam.type}</span></td>
            <td>${exam.class}</td>
            <td>${exam.subject}</td>
            <td>
                <div class="class-info">
                    <div>${dateTime}</div>
                </div>
            </td>
            <td>
                <div class="class-stats">
                    <div class="stats-item">
                        <div class="stats-number">${exam.totalMarks}</div>
                        <div class="stats-label">Total</div>
                    </div>
                    <div class="stats-item">
                        <div class="stats-number">${exam.passMarks}</div>
                        <div class="stats-label">Pass</div>
                    </div>
                </div>
            </td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewExam('${exam.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-secondary" onclick="editExam('${exam.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-success" onclick="startExam('${exam.id}')">
                    <i class="fas fa-play"></i> Start
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteExam('${exam.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getStatusBadge(status) {
    const badges = {
        'Scheduled': '<span class="status-badge status-present">Scheduled</span>',
        'Ongoing': '<span class="status-badge status-paid">Ongoing</span>',
        'Completed': '<span class="status-badge status-present">Completed</span>',
        'Cancelled': '<span class="status-badge status-absent">Cancelled</span>'
    };
    return badges[status] || '<span class="status-badge status-pending">Unknown</span>';
}

function viewExam(examId) {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    
    const details = `
        Exam Details
        ============
        
        Exam Name: ${exam.name}
        Type: ${exam.type}
        Class: ${exam.class}
        Subject: ${exam.subject}
        Date: ${formatDate(exam.date)}
        Time: ${exam.time || 'Not specified'}
        Duration: ${exam.duration} minutes
        Total Marks: ${exam.totalMarks}
        Passing Marks: ${exam.passMarks}
        Room/Hall: ${exam.room || 'Not specified'}
        Status: ${exam.status}
        Weightage: ${exam.weightage}%
        
        Syllabus/Topics:
        ${exam.syllabus || 'Not specified'}
        
        Instructions:
        ${exam.instructions || 'No special instructions'}
    `;
    
    alert(details);
}

function editExam(examId) {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    
    // Populate form with exam data
    document.getElementById('exam-name').value = exam.name;
    document.getElementById('exam-type').value = exam.type;
    document.getElementById('exam-class').value = exam.class;
    document.getElementById('exam-date').value = exam.date;
    document.getElementById('exam-time').value = exam.time || '09:00';
    document.getElementById('exam-duration').value = exam.duration || 120;
    document.getElementById('exam-total-marks').value = exam.totalMarks;
    document.getElementById('exam-pass-marks').value = exam.passMarks || '';
    document.getElementById('exam-room').value = exam.room || '';
    document.getElementById('exam-syllabus').value = exam.syllabus || '';
    document.getElementById('exam-instructions').value = exam.instructions || '';
    document.getElementById('exam-status').value = exam.status;
    document.getElementById('exam-weightage').value = exam.weightage || '';
    
    // Load subjects for the selected class
    loadClassSubjects();
    document.getElementById('exam-subject').value = exam.subject;
    
    showModal('add-exam-modal');
}

function startExam(examId) {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    
    if (exam.status === 'Completed') {
        showAlert('This exam has already been completed', 'warning');
        return;
    }
    
    if (confirm(`Start exam "${exam.name}" for ${exam.class}?`)) {
        exam.status = 'Ongoing';
        saveData('exams', exams);
        loadExams();
        showAlert(`Exam "${exam.name}" has been started!`, 'success');
    }
}

function deleteExam(examId) {
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    
    if (exam.status === 'Ongoing') {
        showAlert('Cannot delete an ongoing exam. Please complete or cancel it first.', 'warning');
        return;
    }
    
    if (confirm(`Are you sure you want to delete exam "${exam.name}"?`)) {
        exams = exams.filter(e => e.id !== examId);
        saveData('exams', exams);
        loadExams();
        showAlert('Exam deleted successfully!', 'success');
    }
}

function populateExamSelects() {
    const examSelect = document.getElementById('results-exam');
    if (!examSelect) return;
    
    examSelect.innerHTML = '<option value="">Select Exam</option>';
    exams.forEach(exam => {
        const option = document.createElement('option');
        option.value = exam.id;
        option.textContent = exam.name;
        examSelect.appendChild(option);
    });
}

function loadResults() {
    const classSelect = document.getElementById('results-class');
    const examSelect = document.getElementById('results-exam');
    const tbody = document.getElementById('results-tbody');
    
    if (!classSelect || !examSelect || !tbody) return;
    
    const selectedClass = classSelect.value;
    const selectedExam = examSelect.value;
    
    if (!selectedClass || !selectedExam) {
        showAlert('Please select class and exam', 'warning');
        return;
    }
    
    // Filter students by class
    const classStudents = students.filter(s => s.class === selectedClass);
    
    tbody.innerHTML = '';
    
    classStudents.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.roll || student.id}</td>
            <td>${student.name}</td>
            <td><input type="number" placeholder="Marks" min="0" max="100"></td>
            <td><span class="status-badge status-pending">Grade</span></td>
            <td>
                <button class="btn btn-sm btn-success" onclick="saveResult('${student.id}')">
                    <i class="fas fa-save"></i> Save
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function saveResult(studentId) {
    showAlert('Result saved successfully!', 'success');
}

function generateReportCard() {
    showAlert('Report card generation functionality will be implemented', 'info');
}

function generateClassReport() {
    showAlert('Class performance report generation functionality will be implemented', 'info');
}

// Fee Management Functions
function showAddFeeForm() {
    showModal('add-fee-modal');
}

function showRecordPaymentForm() {
    populateStudentSelects();
    document.getElementById('payment-date').value = currentDate;
    showModal('add-payment-modal');
}

function addFeeStructure(event) {
    event.preventDefault();
    
    const feeData = {
        id: generateId(),
        class: document.getElementById('fee-class').value,
        type: document.getElementById('fee-type').value,
        amount: parseFloat(document.getElementById('fee-amount').value),
        dueDate: document.getElementById('fee-due-date').value,
        frequency: document.getElementById('fee-frequency').value,
        status: document.getElementById('fee-status').value,
        description: document.getElementById('fee-description').value,
        createdAt: new Date().toISOString()
    };
    
    fees.push(feeData);
    saveData('fees', fees);
    loadFees();
    closeModal('add-fee-modal');
    showAlert('Fee structure added successfully!', 'success');
    
    // Reset form
    document.getElementById('add-fee-form').reset();
}

function recordFeePayment(event) {
    event.preventDefault();
    
    const paymentData = {
        id: generateId(),
        studentId: document.getElementById('payment-student').value,
        feeType: document.getElementById('payment-fee-type').value,
        amount: parseFloat(document.getElementById('payment-amount').value),
        paymentDate: document.getElementById('payment-date').value,
        method: document.getElementById('payment-method').value,
        reference: document.getElementById('payment-reference').value,
        remarks: document.getElementById('payment-remarks').value,
        createdAt: new Date().toISOString()
    };
    
    feePayments.push(paymentData);
    saveData('feePayments', feePayments);
    loadFeePayments();
    closeModal('add-payment-modal');
    showAlert('Payment recorded successfully!', 'success');
    
    // Reset form
    document.getElementById('add-payment-form').reset();
}

function loadFees() {
    const tbody = document.getElementById('fee-structure-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    fees.forEach(fee => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${fee.class}</td>
            <td>${fee.type}</td>
            <td>₹${fee.amount.toLocaleString()}</td>
            <td>${fee.frequency}</td>
            <td>${fee.dueDate}</td>
            <td><span class="status-badge ${fee.status === 'Active' ? 'status-present' : 'status-absent'}">${fee.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editFee('${fee.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteFee('${fee.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function loadFeePayments() {
    const tbody = document.getElementById('fee-payments-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    feePayments.forEach(payment => {
        const student = students.find(s => s.id === payment.studentId);
        const studentName = student ? student.name : 'Unknown Student';
        const studentClass = student ? `${student.class} ${student.section}` : '';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${studentName}</td>
            <td>${studentClass}</td>
            <td>₹${payment.amount.toLocaleString()}</td>
            <td>${payment.feeType}</td>
            <td>${payment.paymentDate}</td>
            <td>${payment.method}</td>
            <td><span class="status-badge status-paid">Paid</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewPaymentDetails('${payment.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-danger" onclick="deletePayment('${payment.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateFeeSelects() {
    const monthSelect = document.getElementById('fee-month');
    if (!monthSelect) return;
    
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    monthSelect.innerHTML = '<option value="">Select Month</option>';
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
}

function loadFeePayments() {
    const classSelect = document.getElementById('fee-class');
    const monthSelect = document.getElementById('fee-month');
    
    if (!classSelect || !monthSelect) return;
    
    const selectedClass = classSelect.value;
    const selectedMonth = monthSelect.value;
    
    // Filter payments based on selections
    let filteredPayments = feePayments;
    
    if (selectedClass) {
        const classStudents = students.filter(s => s.class === selectedClass).map(s => s.id);
        filteredPayments = filteredPayments.filter(p => classStudents.includes(p.studentId));
    }
    
    if (selectedMonth) {
        filteredPayments = filteredPayments.filter(p => {
            const paymentMonth = new Date(p.paymentDate).getMonth() + 1;
            return paymentMonth.toString() === selectedMonth;
        });
    }
    
    const tbody = document.getElementById('fee-payments-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    filteredPayments.forEach(payment => {
        const student = students.find(s => s.id === payment.studentId);
        const studentName = student ? student.name : 'Unknown Student';
        const studentClass = student ? `${student.class} ${student.section}` : '';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${studentName}</td>
            <td>${studentClass}</td>
            <td>₹${payment.amount.toLocaleString()}</td>
            <td>${payment.feeType}</td>
            <td>${payment.paymentDate}</td>
            <td>${payment.method}</td>
            <td><span class="status-badge status-paid">Paid</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewPaymentDetails('${payment.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-danger" onclick="deletePayment('${payment.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateStudentSelects() {
    const studentSelect = document.getElementById('payment-student');
    if (!studentSelect) return;
    
    studentSelect.innerHTML = '<option value="">Select Student</option>';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} (${student.class} ${student.section})`;
        studentSelect.appendChild(option);
    });
}

function loadStudentFees() {
    const studentSelect = document.getElementById('payment-student');
    const feeTypeSelect = document.getElementById('payment-fee-type');
    
    if (!studentSelect || !feeTypeSelect) return;
    
    const selectedStudentId = studentSelect.value;
    if (!selectedStudentId) return;
    
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;
    
    // Filter fees for the student's class
    const classFees = fees.filter(f => f.class === student.class && f.status === 'Active');
    
    feeTypeSelect.innerHTML = '<option value="">Select Fee Type</option>';
    classFees.forEach(fee => {
        const option = document.createElement('option');
        option.value = fee.type;
        option.textContent = `${fee.type} - ₹${fee.amount.toLocaleString()}`;
        feeTypeSelect.appendChild(option);
    });

    // Append standard installment options (1st to 10th Payment)
    const installmentLabels = [
        '1st Payment', '2nd Payment', '3rd Payment', '4th Payment', '5th Payment',
        '6th Payment', '7th Payment', '8th Payment', '9th Payment', '10th Payment'
    ];
    installmentLabels.forEach(label => {
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        feeTypeSelect.appendChild(option);
    });
}

function editFee(feeId) {
    const fee = fees.find(f => f.id === feeId);
    if (fee) {
        // Populate form with fee data
        document.getElementById('fee-class').value = fee.class;
        document.getElementById('fee-type').value = fee.type;
        document.getElementById('fee-amount').value = fee.amount;
        document.getElementById('fee-due-date').value = fee.dueDate;
        document.getElementById('fee-frequency').value = fee.frequency;
        document.getElementById('fee-status').value = fee.status;
        document.getElementById('fee-description').value = fee.description || '';
        
        showModal('add-fee-modal');
    }
}

function deleteFee(feeId) {

    // Open teacher details in the Profile module (read-only view similar to user profile)
    showTeacherProfile(teacherId);
    const totalCollection = feePayments.reduce((sum, payment) => sum + payment.amount, 0);

function showTeacherProfile(teacherId) {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;

    // Switch to Profile module and open Overview tab
    showModule('profile');

    // Hide header actions (edit/change password) when viewing another teacher
    const headerActions = document.querySelector('#profile .header-actions');
    if (headerActions) {
        // store previous display so we can restore later
        headerActions.dataset.prevDisplay = headerActions.style.display || '';
        headerActions.style.display = 'none';
    }

    // Ensure Overview tab is active
    const tabs = document.querySelectorAll('#profile .tabs .tab-btn');
    tabs.forEach(btn => btn.classList.remove('active'));
    const overviewBtn = Array.from(tabs).find(b => b.textContent.trim().toLowerCase().startsWith('overview'));
    if (overviewBtn) overviewBtn.classList.add('active');
    const contents = document.querySelectorAll('#profile .tab-content');
    contents.forEach(c => c.classList.remove('active'));
    const overviewTab = document.getElementById('profile-overview-tab');
    if (overviewTab) overviewTab.classList.add('active');

    // Fill profile overview fields with teacher data
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text || '\u2014'; };
    setText('profile-overview-name', teacher.name);
    setText('profile-overview-email', teacher.email);
    setText('profile-overview-role', teacher.designation || 'Teacher');
    setText('profile-overview-phone', teacher.phone || '');
    setText('profile-overview-gender', teacher.gender || '');
    setText('profile-overview-dob', teacher.dob ? formatDate(teacher.dob) : '\u2014');
    setText('profile-overview-joined', teacher.joiningDate ? formatDate(teacher.joiningDate) : (teacher.createdAt ? formatDate(teacher.createdAt) : '\u2014'));
    setText('profile-overview-lastlogin', '\u2014');

    // Add a custom details section below the table for teacher-specific info (insert if not exists)
    let teacherDetailsArea = document.getElementById('teacher-profile-details');
    if (!teacherDetailsArea) {
        teacherDetailsArea = document.createElement('div');
        teacherDetailsArea.id = 'teacher-profile-details';
        teacherDetailsArea.style.marginTop = '1rem';
        const overviewTabEl = document.getElementById('profile-overview-tab');
        if (overviewTabEl) overviewTabEl.appendChild(teacherDetailsArea);
    }

    const assignedClasses = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
    teacherDetailsArea.innerHTML = `
        <h4 style="margin-top:1rem;">Teacher Information</h4>
        <table class="data-table" style="width:auto; margin-top:0.5rem;">
            <tbody>
                <tr><th style="width:200px">Employee ID</th><td>${teacher.id}</td></tr>
                <tr><th>Designation</th><td>${teacher.designation || 'Teacher'}</td></tr>
                <tr><th>Primary Subject</th><td>${teacher.subject || '\u2014'}</td></tr>
                <tr><th>Qualification</th><td>${teacher.qualification || '\u2014'}</td></tr>
                <tr><th>Experience</th><td>${teacher.experience != null ? teacher.experience + ' years' : '\u2014'}</td></tr>
                <tr><th>Salary</th><td>${teacher.salary ? '₹' + Number(teacher.salary).toLocaleString() : '\u2014'}</td></tr>
                <tr><th>Assigned Classes</th><td>${assignedClasses.length > 0 ? assignedClasses.join(', ') : 'No classes assigned'}</td></tr>
                <tr><th>Address</th><td>${teacher.address || '\u2014'}</td></tr>
                <tr><th>Emergency Contact</th><td>${teacher.emergencyContact || '\u2014'}</td></tr>
            </tbody>
        </table>
    `;

    // When user navigates away from profile, restore the header actions display
    // We'll attach a one-time event listener to restore when another module is shown
    const observer = new MutationObserver((mutations) => {
        // If profile module no longer has 'active' class, restore
        const profileModule = document.getElementById('profile');
        if (!profileModule || !profileModule.classList.contains('active')) {
            restoreProfileViewState();
            observer.disconnect();
        }
    });
    observer.observe(document.getElementById('profile'), { attributes: true, attributeFilter: ['class'] });
}
    const monthlyCollection = feePayments.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        const currentDate = new Date();
        return paymentDate.getMonth() === currentDate.getMonth() && 
               paymentDate.getFullYear() === currentDate.getFullYear();
    }).reduce((sum, payment) => sum + payment.amount, 0);
    
    const report = `
        Fee Collection Report
        ====================
        
        Total Collection: ₹${totalCollection.toLocaleString()}
        Monthly Collection: ₹${monthlyCollection.toLocaleString()}
        Total Payments: ${feePayments.length}
        
        Payment Methods:
        ${getPaymentMethodBreakdown()}
    `;
    
    alert(report);
}

function generatePendingFeeReport() {
    let pendingStudents = [];
    
    students.forEach(student => {
        const classFees = fees.filter(f => f.class === student.class && f.status === 'Active');
        const studentPayments = feePayments.filter(p => p.studentId === student.id);
        
        let totalDue = 0;
        let totalPaid = 0;
        
        classFees.forEach(fee => {
            totalDue += fee.amount;
            const feePayments = studentPayments.filter(p => p.feeType === fee.type);
            totalPaid += feePayments.reduce((sum, p) => sum + p.amount, 0);
        });
        
        if (totalPaid < totalDue) {
            pendingStudents.push({
                name: student.name,
                class: `${student.class} ${student.section}`,
                pending: totalDue - totalPaid
            });
        }
    });
    
    if (pendingStudents.length === 0) {
        alert('No pending fees found!');
        return;
    }
    
    let report = 'Pending Fees Report\n==================\n\n';
    pendingStudents.forEach(student => {
        report += `${student.name} (${student.class}): ₹${student.pending.toLocaleString()}\n`;
    });
    
    alert(report);
}

function getPaymentMethodBreakdown() {
    const methods = {};
    feePayments.forEach(payment => {
        methods[payment.method] = (methods[payment.method] || 0) + 1;
    });
    
    let breakdown = '';
    Object.keys(methods).forEach(method => {
        breakdown += `${method}: ${methods[method]} payments\n`;
    });
    
    return breakdown;
}

// User Permission Functions
function checkUserPermissions() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Hide/show modules based on user role
    const modules = {
        'students': ['admin', 'teacher'],
        'classes': ['admin', 'teacher'],
        'attendance': ['admin', 'teacher'],
        'exams': ['admin', 'teacher'],
        'fees': ['admin'],
        'teachers': ['admin'],
        'parents': ['admin', 'teacher', 'parent'],
        'profile': ['admin', 'teacher', 'parent']
    };
    
    // Hide navigation items based on role
    Object.keys(modules).forEach(module => {
        const navLink = document.querySelector(`[data-module="${module}"]`);
        if (navLink && !modules[module].includes(currentUser.role)) {
            navLink.style.display = 'none';
        }
    });
    
    // Set default module based on role
    if (currentUser.role === 'parent') {
        showModule('parents');
    }
    
    // Hide action buttons based on permissions
    hideUnauthorizedButtons();
}

function hideUnauthorizedButtons() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    // Define button permissions
    const buttonPermissions = {
        'add-student': ['admin'],
        'add-class': ['admin'],
        'add-exam': ['admin', 'teacher'],
        'add-fee': ['admin'],
        'add-teacher': ['admin'],
        'send-notice': ['admin', 'teacher'],
        'record-payment': ['admin'],
        'add-book': ['admin', 'teacher'],
        'add-route': ['admin']
    };
    
    // Hide unauthorized buttons
    Object.keys(buttonPermissions).forEach(buttonClass => {
        const buttons = document.querySelectorAll(`.${buttonClass}, [onclick*="${buttonClass}"]`);
        buttons.forEach(button => {
            if (!buttonPermissions[buttonClass].includes(currentUser.role)) {
                button.style.display = 'none';
            }
        });
    });
    
    // Hide entire modules for parents
    if (currentUser.role === 'parent') {
        const restrictedModules = ['students', 'classes', 'attendance', 'exams', 'fees', 'teachers', 'communication', 'library', 'transport'];
        restrictedModules.forEach(module => {
            const navLink = document.querySelector(`[data-module="${module}"]`);
            if (navLink) {
                navLink.style.display = 'none';
            }
        });
    }
}

function showAccessDenied() {
    showAlert('You do not have permission to access this feature', 'error');
}

// Enhanced user info display
function displayUserInfo() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="user-profile">
                    <span class="user-name">${currentUser.name}</span>
                    <span class="user-role">(${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)})</span>
                </div>
                <i class="fas fa-user-circle user-avatar"></i>
                <div class="user-dropdown">
                    <div class="dropdown-item" onclick="showUserProfile()">
                        <i class="fas fa-user"></i> Profile
                    </div>
                    <div class="dropdown-item" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </div>
                </div>
            `;
        }
    }
}

function showUserProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    // Navigate to profile module and load data
    showModule('profile');
    loadProfileOverview();
    loadProfileEditForm();
}

// Profile Functions
function loadProfileOverview() {
    const user = getCurrentUser();
    if (!user) return;
    const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text || '—'; };
    setText('profile-overview-name', user.name);
    setText('profile-overview-email', user.email);
    setText('profile-overview-role', user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—');
    setText('profile-overview-phone', user.phone);
    setText('profile-overview-gender', user.gender);
    setText('profile-overview-dob', user.dob ? formatDate(user.dob) : '—');
    setText('profile-overview-joined', user.createdAt ? formatDate(user.createdAt) : '—');
    setText('profile-overview-lastlogin', user.lastLogin ? formatDate(user.lastLogin) : '—');
}

function loadProfileEditForm() {
    const user = getCurrentUser();
    if (!user) return;
    const byId = (id) => document.getElementById(id);
    const nameEl = byId('profile-name');
    const emailEl = byId('profile-email');
    const phoneEl = byId('profile-phone');
    const roleEl = byId('profile-role');
    const genderEl = byId('profile-gender');
    const dobEl = byId('profile-dob');
    if (nameEl) nameEl.value = user.name || '';
    if (emailEl) emailEl.value = user.email || '';
    if (phoneEl) phoneEl.value = user.phone || '';
    if (roleEl) roleEl.value = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';
    if (genderEl) genderEl.value = user.gender || '';
    if (dobEl) dobEl.value = user.dob ? user.dob.substring(0,10) : '';
}

function updateProfile(event) {
    if (event) event.preventDefault();
    const user = getCurrentUser();
    if (!user) { showAlert('Not authenticated', 'error'); return; }
    const name = (document.getElementById('profile-name') || {}).value || '';
    const phone = (document.getElementById('profile-phone') || {}).value || '';
    const gender = (document.getElementById('profile-gender') || {}).value || '';
    const dob = (document.getElementById('profile-dob') || {}).value || '';
    if (!name || !phone) { showAlert('Name and phone are required', 'warning'); return; }
    // Update current_user
    const updated = { ...user, name, phone, gender, dob };
    localStorage.setItem('current_user', JSON.stringify(updated));
    // Update in users store
    const users = JSON.parse(localStorage.getItem('school_users') || '[]');
    const idx = users.findIndex(u => u.email === user.email);
    if (idx !== -1) {
        users[idx] = { ...users[idx], name, phone, gender, dob };
        localStorage.setItem('school_users', JSON.stringify(users));
    }
    // Refresh UI
    loadProfileOverview();
    loadProfileEditForm();
    displayUserInfo();
    showAlert('Profile updated successfully!', 'success');
}

function changePassword(event) {
    if (event) event.preventDefault();
    const user = getCurrentUser();
    if (!user) { showAlert('Not authenticated', 'error'); return; }
    const currentPwd = (document.getElementById('current-password') || {}).value || '';
    const newPwd = (document.getElementById('new-password') || {}).value || '';
    const confirmPwd = (document.getElementById('confirm-password') || {}).value || '';
    if (!currentPwd || !newPwd || !confirmPwd) { showAlert('Please fill in all password fields', 'warning'); return; }
    if (newPwd.length < 6) { showAlert('New password must be at least 6 characters', 'warning'); return; }
    if (newPwd !== confirmPwd) { showAlert('New passwords do not match', 'error'); return; }
    // Validate against users store
    const users = JSON.parse(localStorage.getItem('school_users') || '[]');
    const idx = users.findIndex(u => u.email === user.email);
    if (idx === -1) { showAlert('User not found', 'error'); return; }
    if (users[idx].password !== currentPwd) { showAlert('Current password is incorrect', 'error'); return; }
    users[idx].password = newPwd;
    localStorage.setItem('school_users', JSON.stringify(users));
    showAlert('Password updated successfully!', 'success');
    // Clear fields
    ['current-password','new-password','confirm-password'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
}

function goToEditProfile() {
    showModule('profile');
    const tabs = document.querySelectorAll('#profile .tabs .tab-btn');
    tabs.forEach(btn => btn.classList.remove('active'));
    const editBtn = Array.from(tabs).find(b => b.textContent.trim().toLowerCase() === 'edit profile');
    if (editBtn) editBtn.classList.add('active');
    const contents = document.querySelectorAll('#profile .tab-content');
    contents.forEach(c => c.classList.remove('active'));
    const editTab = document.getElementById('profile-edit-tab');
    if (editTab) editTab.classList.add('active');
    loadProfileEditForm();
    const first = document.getElementById('profile-name');
    if (first) first.focus();
}

function goToChangePassword() {
    showModule('profile');
    const tabs = document.querySelectorAll('#profile .tabs .tab-btn');
    tabs.forEach(btn => btn.classList.remove('active'));
    const pwBtn = Array.from(tabs).find(b => b.textContent.trim().toLowerCase() === 'change password');
    if (pwBtn) pwBtn.classList.add('active');
    const contents = document.querySelectorAll('#profile .tab-content');
    contents.forEach(c => c.classList.remove('active'));
    const pwTab = document.getElementById('profile-password-tab');
    if (pwTab) pwTab.classList.add('active');
    const first = document.getElementById('current-password');
    if (first) first.focus();
}

// Teacher Management Functions
function showAddTeacherForm() {
    document.getElementById('teacher-joining-date').value = currentDate;
    showModal('add-teacher-modal');
}

function addTeacher(event) {
    event.preventDefault();
    
    const teacherName = document.getElementById('teacher-name').value;
    const teacherEmail = document.getElementById('teacher-email').value;
    const teacherPhone = document.getElementById('teacher-phone').value;
    const teacherGender = document.getElementById('teacher-gender').value;
    const teacherDob = document.getElementById('teacher-dob').value;
    const teacherJoiningDate = document.getElementById('teacher-joining-date').value;
    const teacherSubject = document.getElementById('teacher-subject').value;
    const teacherQualification = document.getElementById('teacher-qualification').value;
    const teacherExperience = parseInt(document.getElementById('teacher-experience').value) || 0;
    const teacherSalary = parseInt(document.getElementById('teacher-salary').value) || 0;
    const teacherAddress = document.getElementById('teacher-address').value;
    const teacherEmergencyContact = document.getElementById('teacher-emergency-contact').value;
    const teacherDesignation = document.getElementById('teacher-designation').value;
    const teacherStatus = document.getElementById('teacher-status').value;
    
    // Get selected classes
    const classCheckboxes = document.querySelectorAll('.class-checkbox:checked');
    const assignedClasses = Array.from(classCheckboxes).map(cb => cb.value);
    
    if (!teacherName || !teacherEmail || !teacherPhone || !teacherJoiningDate || !teacherSubject || !teacherQualification) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    // Check if email already exists
    const existingTeacher = teachers.find(t => t.email === teacherEmail);
    if (existingTeacher) {
        showAlert('A teacher with this email address already exists!', 'error');
        return;
    }
    
    const teacherData = {
        id: generateId(),
        name: teacherName,
        email: teacherEmail,
        phone: teacherPhone,
        gender: teacherGender,
        dob: teacherDob,
        joiningDate: teacherJoiningDate,
        subject: teacherSubject,
        qualification: teacherQualification,
        experience: teacherExperience,
        salary: teacherSalary,
        assignedClasses: assignedClasses,
        address: teacherAddress,
        emergencyContact: teacherEmergencyContact,
        designation: teacherDesignation || 'Teacher',
        status: teacherStatus,
        createdAt: new Date().toISOString()
    };
    
    teachers.push(teacherData);
    saveData('teachers', teachers);
    loadTeachers();
    updateDashboard();
    closeModal('add-teacher-modal');
    showAlert(`Teacher "${teacherName}" added successfully!`, 'success');
    
    // Reset form
    document.getElementById('add-teacher-form').reset();
    document.getElementById('teacher-joining-date').value = currentDate;
    
    // Uncheck all class checkboxes
    document.querySelectorAll('.class-checkbox').forEach(cb => cb.checked = false);
}

function loadTeachers() {
    const tbody = document.getElementById('teachers-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // If no teachers exist, show message
    if (teachers.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 2rem; color: #6c757d;">
                <i class="fas fa-chalkboard-teacher" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                No teachers found. Click "Add New Teacher" to add your first teacher.
            </td>
        `;
        tbody.appendChild(row);
        return;
    }
    
    teachers.forEach(teacher => {
        // Ensure assignedClasses is an array (some older records may omit this field)
        const assignedClasses = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
        const assignedClassesText = assignedClasses.length > 0 ? assignedClasses.join(', ') : 'No classes assigned';
        const assignedClassesDisplay = assignedClassesText.length > 30 ? assignedClassesText.substring(0, 30) + '...' : assignedClassesText;
        
        const statusBadge = getTeacherStatusBadge(teacher.status);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="class-info">
                    <div class="class-name">${teacher.name}</div>
                    <div class="class-details">ID: ${teacher.id}</div>
                    <div class="class-details">${teacher.designation}</div>
                </div>
            </td>
            <td>
                <div class="class-info">
                    <div>${teacher.subject}</div>
                    <div class="class-details">${teacher.qualification}</div>
                </div>
            </td>
            <td>
                <div title="${assignedClassesText}">${assignedClassesDisplay}</div>
            </td>
            <td>
                <div class="class-info">
                    <div>${teacher.phone}</div>
                    <div class="class-details">${teacher.email}</div>
                </div>
            </td>
            <td>
                <div class="class-stats">
                    <div class="stats-item">
                        <div class="stats-number">${teacher.experience}</div>
                        <div class="stats-label">Years</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="class-info">
                    <div>₹${teacher.salary.toLocaleString()}</div>
                    <div class="class-details">${statusBadge}</div>
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewTeacher('${teacher.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-secondary" onclick="editTeacher('${teacher.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTeacher('${teacher.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getTeacherStatusBadge(status) {
    const badges = {
        'Active': '<span class="status-badge status-present">Active</span>',
        'On Leave': '<span class="status-badge status-pending">On Leave</span>',
        'Resigned': '<span class="status-badge status-absent">Resigned</span>',
        'Terminated': '<span class="status-badge status-absent">Terminated</span>'
    };
    return badges[status] || '<span class="status-badge status-pending">Unknown</span>';
}

function viewTeacher(teacherId) {
    // Navigate to dedicated teacher profile page
    window.location.href = `teacher.html?id=${encodeURIComponent(teacherId)}`;
}

function editTeacher(teacherId) {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    
    // Populate form with teacher data
    document.getElementById('teacher-name').value = teacher.name;
    document.getElementById('teacher-email').value = teacher.email;
    document.getElementById('teacher-phone').value = teacher.phone;
    document.getElementById('teacher-gender').value = teacher.gender || '';
    document.getElementById('teacher-dob').value = teacher.dob || '';
    document.getElementById('teacher-joining-date').value = teacher.joiningDate;
    document.getElementById('teacher-subject').value = teacher.subject;
    document.getElementById('teacher-qualification').value = teacher.qualification;
    document.getElementById('teacher-experience').value = teacher.experience || '';
    document.getElementById('teacher-salary').value = teacher.salary || '';
    document.getElementById('teacher-address').value = teacher.address || '';
    document.getElementById('teacher-emergency-contact').value = teacher.emergencyContact || '';
    document.getElementById('teacher-designation').value = teacher.designation || '';
    document.getElementById('teacher-status').value = teacher.status;
    
    // Check assigned classes (guard if field missing)
    const assignedClassesForEdit = Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses : [];
    document.querySelectorAll('.class-checkbox').forEach(cb => {
        cb.checked = assignedClassesForEdit.includes(cb.value);
    });
    
    showModal('add-teacher-modal');
}

function deleteTeacher(teacherId) {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    
    // Check if teacher is assigned to any classes
    const assignedClasses = classes.filter(c => c.teacherId === teacherId);
    if (assignedClasses.length > 0) {
        showAlert(`Cannot delete teacher. ${assignedClasses.length} classes are still assigned to this teacher.`, 'warning');
        return;
    }
    
    if (confirm(`Are you sure you want to delete teacher "${teacher.name}"?`)) {
        teachers = teachers.filter(t => t.id !== teacherId);
        saveData('teachers', teachers);
        loadTeachers();
        updateDashboard();
        showAlert('Teacher deleted successfully!', 'success');
    }
}

// Communication Functions
function showSendNoticeForm() {
    populateNoticeClassSelects();
    document.getElementById('notice-date').value = currentDate;
    showModal('send-notice-modal');
}

function populateNoticeClassSelects() {
    const classSelect = document.getElementById('notice-class');
    const sectionSelect = document.getElementById('notice-section');
    
    if (!classSelect || !sectionSelect) return;
    
    // Get unique classes from students
    const uniqueClasses = [...new Set(students.map(s => s.class))].sort();
    
    classSelect.innerHTML = '<option value="">Select Class</option>';
    uniqueClasses.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls;
        option.textContent = cls;
        classSelect.appendChild(option);
    });
    
    // Populate sections
    sectionSelect.innerHTML = '<option value="">Select Section</option>';
    const uniqueSections = [...new Set(students.map(s => s.section))].sort();
    uniqueSections.forEach(section => {
        const option = document.createElement('option');
        option.value = section;
        option.textContent = section;
        sectionSelect.appendChild(option);
    });
}

function toggleAllRecipients() {
    const allCheckbox = document.getElementById('recipient-all');
    const teachersCheckbox = document.getElementById('recipient-teachers');
    const specificCheckbox = document.getElementById('recipient-specific-class');
    
    if (allCheckbox.checked) {
        teachersCheckbox.checked = false;
        specificCheckbox.checked = false;
        document.getElementById('specific-class-selection').style.display = 'none';
    }
    updateRecipients();
}

function toggleSpecificClass() {
    const specificCheckbox = document.getElementById('recipient-specific-class');
    const allCheckbox = document.getElementById('recipient-all');
    const teachersCheckbox = document.getElementById('recipient-teachers');
    
    if (specificCheckbox.checked) {
        allCheckbox.checked = false;
        teachersCheckbox.checked = false;
        document.getElementById('specific-class-selection').style.display = 'flex';
    } else {
        document.getElementById('specific-class-selection').style.display = 'none';
    }
    updateRecipients();
}

function updateRecipients() {
    // This function would update the recipient count display
    // For now, it's a placeholder for future enhancement
}

function previewNotice() {
    const titleEl = document.getElementById('notice-title');
    const typeEl = document.getElementById('notice-type');
    const priority = document.getElementById('notice-priority').value;
    const dateEl = document.getElementById('notice-date');
    const contentEl = document.getElementById('notice-content');
    const validity = document.getElementById('notice-validity').value;
    
    // Clear previous error states
    [titleEl, typeEl, dateEl, contentEl].forEach(el => { if (el) el.classList.remove('field-error'); });

    const missing = [];
    if (!titleEl || !titleEl.value.trim()) missing.push({ el: titleEl, name: 'Notice Title' });
    if (!typeEl || !typeEl.value.trim()) missing.push({ el: typeEl, name: 'Notice Type' });
    if (!dateEl || !dateEl.value.trim()) missing.push({ el: dateEl, name: 'Notice Date' });
    if (!contentEl || !contentEl.value.trim()) missing.push({ el: contentEl, name: 'Notice Content' });

    if (missing.length > 0) {
        // Highlight missing fields
        missing.forEach(m => { if (m.el) m.el.classList.add('field-error'); });
        // Focus first missing
        if (missing[0].el) missing[0].el.focus();
        const names = missing.map(m => m.name).join(', ');
        showAlert(`Please fill in required fields: ${names}`, 'warning');
        return;
    }
    
    const recipients = getSelectedRecipients();
    const sendMethods = getSelectedSendMethods();
    
    const previewContent = document.getElementById('notice-preview-content');
    previewContent.innerHTML = `
        <div class="notice-preview">
            <div class="notice-header">
                <div class="notice-title">${title}</div>
                <div style="display: flex; justify-content: center; gap: 1rem; align-items: center;">
                    <span class="priority-badge priority-${priority.toLowerCase()}">${priority}</span>
                    <span style="color: #6c757d;">${type} Notice</span>
                </div>
            </div>
            
            <div class="notice-meta">
                <div><strong>Date:</strong> ${formatDate(date)}</div>
                <div><strong>Recipients:</strong> ${recipients}</div>
                <div><strong>Send Methods:</strong> ${sendMethods}</div>
                ${validity ? `<div><strong>Valid Until:</strong> ${formatDate(validity)}</div>` : ''}
            </div>
            
            <div class="notice-content">
                ${content.replace(/\n/g, '<br>')}
            </div>
            
            <div class="notice-footer">
                <p><strong>Bhramnath Digital Class</strong><br>
                School Management System</p>
            </div>
        </div>
    `;
    
    showModal('notice-preview-modal');
}

function sendNotice(event) {
    if (event) event.preventDefault();
    
    const title = document.getElementById('notice-title').value;
    const type = document.getElementById('notice-type').value;
    const priority = document.getElementById('notice-priority').value;
    const date = document.getElementById('notice-date').value;
    const content = document.getElementById('notice-content').value;
    const validity = document.getElementById('notice-validity').value;
    const reminder = document.getElementById('notice-reminder').value;
    
    if (!title || !type || !date || !content) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    const recipients = getSelectedRecipients();
    const sendMethods = getSelectedSendMethods();
    
    const noticeData = {
        id: generateId(),
        title,
        type,
        priority,
        date,
        content,
        validity: validity || null,
        recipients,
        sendMethods,
        reminder,
        status: 'Sent',
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString()
    };
    
    notices.push(noticeData);
    saveData('notices', notices);
    // loadNotices removed
    closeModal('send-notice-modal');
    closeModal('notice-preview-modal');
    
    // Show success message with details
    const message = `Notice sent successfully to ${recipients} via ${sendMethods}`;
    showAlert(message, 'success');
    
    // Reset form
    document.getElementById('send-notice-form').reset();
    
    // Simulate sending notifications
    simulateNotificationSending(noticeData);

    // If WhatsApp was selected, attempt to open WhatsApp Web/API with prefilled message
    if (noticeData.sendMethods && noticeData.sendMethods.toLowerCase().includes('whatsapp')) {
        try {
            sendViaWhatsApp(noticeData);
        } catch (e) {
            console.error('WhatsApp send failed', e);
        }
    }
}

function sendViaWhatsApp(noticeData) {
    // Build message text
    const parts = [];
    if (noticeData.title) parts.push(noticeData.title);
    if (noticeData.date) parts.push('Date: ' + formatDate(noticeData.date));
    if (noticeData.content) parts.push('\n' + noticeData.content);
    parts.push('\n--\n' + 'Bhramnath Digital Class');
    const message = encodeURIComponent(parts.join('\n\n'));

    // Collect phone numbers based on current form selections
    const phones = collectWhatsAppNumbersFromForm();

    // If we have specific phone numbers, open api.whatsapp.com/send for each (cap to 8)
    const validPhones = phones.filter(p => p && p.length >= 8);
    if (validPhones.length > 0) {
        const cap = 8;
        const toOpen = validPhones.slice(0, cap);
        toOpen.forEach(num => {
            // Use api.whatsapp.com with phone number (must be in international format ideally)
            const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(num)}&text=${message}`;
            window.open(url, '_blank');
        });
        if (validPhones.length > cap) {
            showAlert(`Opened WhatsApp for ${cap} recipients. ${validPhones.length - cap} more recipients were skipped to avoid opening too many tabs.`, 'info');
        }
        return;
    }

    // Fallback: open WhatsApp Web with message prefilled so user can pick recipients manually
    const webUrl = `https://web.whatsapp.com/send?text=${message}`;
    window.open(webUrl, '_blank');
    showAlert('Opened WhatsApp Web with prefilled message. Please choose recipients in WhatsApp Web to send.', 'info');
}

function collectWhatsAppNumbersFromForm() {
    // Determine recipients based on the send notice form checkboxes and class selectors
    const phones = new Set();

    const allCheckbox = document.getElementById('recipient-all');
    const teachersCheckbox = document.getElementById('recipient-teachers');
    const specificCheckbox = document.getElementById('recipient-specific-class');

    if (allCheckbox && allCheckbox.checked) {
        students.forEach(s => {
            if (s.guardianPhone) phones.add(cleanPhone(s.guardianPhone));
            if (s.phone) phones.add(cleanPhone(s.phone));
        });
    }

    if (teachersCheckbox && teachersCheckbox.checked) {
        teachers.forEach(t => { if (t.phone) phones.add(cleanPhone(t.phone)); });
    }

    if (specificCheckbox && specificCheckbox.checked) {
        const cls = document.getElementById('notice-class') ? document.getElementById('notice-class').value : '';
        const sec = document.getElementById('notice-section') ? document.getElementById('notice-section').value : '';
        if (cls) {
            let classStudents = students.filter(s => s.class === cls);
            if (sec) classStudents = classStudents.filter(s => s.section === sec);
            classStudents.forEach(s => { if (s.guardianPhone) phones.add(cleanPhone(s.guardianPhone)); if (s.phone) phones.add(cleanPhone(s.phone)); });
        }
    }

    // Return array of cleaned phone numbers (non-empty)
    const result = Array.from(phones).filter(Boolean);
    // Append any uploaded contacts
    if (uploadedContacts && uploadedContacts.length > 0) {
        uploadedContacts.forEach(p => {
            const c = cleanPhone(p);
            if (c) result.push(c);
        });
    }
    // Deduplicate
    return Array.from(new Set(result));
}

function cleanPhone(phone) {
    if (!phone) return '';
    // Remove spaces, parentheses, plus signs and dashes
    const cleaned = String(phone).replace(/[\s()\-+]/g, '');
    // Remove leading zeros (not ideal for country codes) - keep as-is to avoid altering
    return cleaned;
}

function handleContactsFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) {
        parseCSVFile(file).then(phones => {
            uploadedContacts = phones;
            showAlert(`Parsed ${phones.length} contact(s) from uploaded CSV.`, 'success');
        }).catch(err => {
            console.error(err);
            showAlert('Failed to parse CSV file. Please ensure it is a valid CSV.', 'error');
        });
    } else if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
        // Try to parse Excel by reading as binary and using a lightweight approach
        parseExcelFile(file).then(phones => {
            uploadedContacts = phones;
            showAlert(`Parsed ${phones.length} contact(s) from uploaded Excel file.`, 'success');
        }).catch(err => {
            console.error(err);
            showAlert('Failed to parse Excel file. Try exporting contacts as CSV instead.', 'error');
        });
    } else {
        showAlert('Unsupported file type. Please upload CSV or Excel file.', 'warning');
    }
}

function parseCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(evt) {
            const text = evt.target.result;
            try {
                const lines = text.split(/\r?\n/).filter(Boolean);
                if (lines.length === 0) return resolve([]);
                const header = lines[0].split(/,|;|\t/).map(h => h.replace(/\r|\n|\s+/g, '').toLowerCase());
                const phoneIdxs = [];
                header.forEach((h, idx) => {
                    if (h.includes('phone') || h.includes('mobile') || h.includes('contact') || h.includes('guardian')) phoneIdxs.push(idx);
                });

                const phones = [];
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(/,|;|\t/).map(c => c.trim());
                    if (phoneIdxs.length > 0) {
                        phoneIdxs.forEach(pi => { if (cols[pi]) phones.push(cols[pi]); });
                    } else {
                        // Heuristic: push any numeric-looking column with length >= 8
                        cols.forEach(c => { if (/\d{8,}/.test(c.replace(/[^0-9]/g, ''))) phones.push(c); });
                    }
                }
                resolve(phones.map(p => p.trim()).filter(Boolean));
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = function(err) { reject(err); };
        reader.readAsText(file);
    });
}

function parseExcelFile(file) {
    // Minimal Excel parsing fallback: attempt to read as text and extract numeric fields
    // Note: Full XLSX parsing would require a library (like SheetJS). Here we attempt a simple fallback.
    return new Promise((resolve, reject) => {
        // Inform user about limited support
        showAlert('Excel parsing is limited. For best results export contacts to CSV and upload that.', 'info');
        const reader = new FileReader();
        reader.onload = function(evt) {
            const content = evt.target.result;
            // Try to extract numbers from the file blob
            const phones = Array.from(String(content).matchAll(/\+?\d[0-9\-\s()]{6,}\d/g) || []).map(m => m[0]);
            resolve(phones.map(p => p.trim()).filter(Boolean));
        };
        reader.onerror = function(err) { reject(err); };
        reader.readAsBinaryString(file);
    });
}

function sendNoticeFromPreview() {
    sendNotice();
}

function getSelectedRecipients() {
    const allCheckbox = document.getElementById('recipient-all');
    const teachersCheckbox = document.getElementById('recipient-teachers');
    const specificCheckbox = document.getElementById('recipient-specific-class');
    
    let recipients = [];
    
    if (allCheckbox.checked) {
        recipients.push(`All Students & Parents (${students.length} students)`);
    }
    
    if (teachersCheckbox.checked) {
        recipients.push(`All Teachers (${teachers.length} teachers)`);
    }
    
    if (specificCheckbox.checked) {
        const selectedClass = document.getElementById('notice-class').value;
        const selectedSection = document.getElementById('notice-section').value;
        
        if (selectedClass) {
            let classStudents = students.filter(s => s.class === selectedClass);
            if (selectedSection) {
                classStudents = classStudents.filter(s => s.section === selectedSection);
            }
            recipients.push(`${selectedClass}${selectedSection ? ' ' + selectedSection : ''} (${classStudents.length} students)`);
        }
    }
    
    return recipients.length > 0 ? recipients.join(', ') : 'No recipients selected';
}

function getSelectedSendMethods() {
    const methods = [];
    if (document.getElementById('send-email').checked) methods.push('Email');
    if (document.getElementById('send-sms').checked) methods.push('SMS');
    if (document.getElementById('send-whatsapp').checked) methods.push('WhatsApp');
    if (document.getElementById('send-portal').checked) methods.push('Portal');
    
    return methods.length > 0 ? methods.join(', ') : 'No methods selected';
}

function simulateNotificationSending(noticeData) {
    // Simulate the sending process
    const methods = noticeData.sendMethods.split(', ');
    let sentCount = 0;
    
    methods.forEach(method => {
        setTimeout(() => {
            sentCount++;
            console.log(`Notice sent via ${method.trim()}`);
            
            if (sentCount === methods.length) {
                showAlert(`All notifications sent successfully via ${noticeData.sendMethods}`, 'success');
            }
        }, 1000 * sentCount);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function loadNotices() {
    const tbody = document.getElementById('notices-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    notices.forEach(notice => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${notice.title}</td>
            <td>${notice.type}</td>
            <td><span class="priority-badge priority-${notice.priority ? notice.priority.toLowerCase() : 'normal'}">${notice.priority || 'Normal'}</span></td>
            <td>${formatDate(notice.date)}</td>
            <td>${notice.recipients}</td>
            <td>${notice.sendMethods || 'Portal'}</td>
            <td><span class="notice-status status-sent">${notice.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewNotice('${notice.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-secondary" onclick="editNotice('${notice.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteNotice('${notice.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function viewNotice(noticeId) {
    const notice = notices.find(n => n.id === noticeId);
    if (notice) {
        const previewContent = document.getElementById('notice-preview-content');
        previewContent.innerHTML = `
            <div class="notice-preview">
                <div class="notice-header">
                    <div class="notice-title">${notice.title}</div>
                    <div style="display: flex; justify-content: center; gap: 1rem; align-items: center;">
                        <span class="priority-badge priority-${notice.priority ? notice.priority.toLowerCase() : 'normal'}">${notice.priority || 'Normal'}</span>
                        <span style="color: #6c757d;">${notice.type} Notice</span>
                    </div>
                </div>
                
                <div class="notice-meta">
                    <div><strong>Date:</strong> ${formatDate(notice.date)}</div>
                    <div><strong>Recipients:</strong> ${notice.recipients}</div>
                    <div><strong>Send Methods:</strong> ${notice.sendMethods}</div>
                    <div><strong>Status:</strong> ${notice.status}</div>
                    ${notice.validity ? `<div><strong>Valid Until:</strong> ${formatDate(notice.validity)}</div>` : ''}
                    ${notice.reminder && notice.reminder !== 'none' ? `<div><strong>Reminder:</strong> ${notice.reminder}</div>` : ''}
                </div>
                
                <div class="notice-content">
                    ${notice.content.replace(/\n/g, '<br>')}
                </div>
                
                <div class="notice-footer">
                    <p><strong>Bhramnath Digital Class</strong><br>
                    School Management System</p>
                    <small>Sent on: ${formatDate(notice.sentAt)}</small>
                </div>
            </div>
        `;
        showModal('notice-preview-modal');
    }
}

function editNotice(noticeId) {
    const notice = notices.find(n => n.id === noticeId);
    if (notice) {
        // Populate form with notice data
        document.getElementById('notice-title').value = notice.title;
        document.getElementById('notice-type').value = notice.type;
        document.getElementById('notice-priority').value = notice.priority || 'Normal';
        document.getElementById('notice-date').value = notice.date;
        document.getElementById('notice-content').value = notice.content;
        document.getElementById('notice-validity').value = notice.validity || '';
        document.getElementById('notice-reminder').value = notice.reminder || 'none';
        
        showModal('send-notice-modal');
    }
}

function deleteNotice(noticeId) {
    if (confirm('Are you sure you want to delete this notice?')) {
        notices = notices.filter(n => n.id !== noticeId);
        saveData('notices', notices);
        loadNotices();
        showAlert('Notice deleted successfully!', 'success');
    }
}

// Library Functions
function showAddBookForm() {
    showAlert('Add Book functionality will be implemented', 'info');
}

function loadBooks() {
    const tbody = document.getElementById('books-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    books.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.id}</td>
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.category}</td>
            <td><span class="status-badge ${book.available ? 'status-present' : 'status-absent'}">${book.available ? 'Available' : 'Issued'}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editBook('${book.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteBook('${book.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Transport Functions
function showAddRouteForm() {
    showAlert('Add Route functionality will be implemented', 'info');
}

function loadRoutes() {
    const tbody = document.getElementById('routes-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    routes.forEach(route => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${route.name}</td>
            <td>${route.vehicle}</td>
            <td>${route.driver}</td>
            <td>${route.students}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editRoute('${route.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteRoute('${route.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Parent Portal Functions
function parentLogin(event) {
    event.preventDefault();
    const username = document.getElementById('parent-username').value;
    const password = document.getElementById('parent-password').value;
    
    // Simple authentication (in real app, this would be server-side)
    if (username && password) {
        showTab('parent-view-tab', document.querySelector('[onclick*="parent-view-tab"]'));
        loadParentStudentInfo();
        showAlert('Login successful!', 'success');
    } else {
        showAlert('Please enter valid credentials', 'error');
    }
}

function loadParentStudentInfo() {
    const studentInfo = document.getElementById('parent-student-info');
    if (!studentInfo) return;
    
    // Find student by guardian phone (simplified)
    const parentUsername = document.getElementById('parent-username').value;
    const student = students.find(s => s.guardianPhone === parentUsername);
    
    if (student) {
        studentInfo.innerHTML = `
            <div class="parent-student-card">
                <h4>${student.name}</h4>
                <p><strong>Class:</strong> ${student.class} ${student.section}</p>
                <p><strong>Roll Number:</strong> ${student.roll || student.id}</p>
                <p><strong>Admission Date:</strong> ${student.admissionDate}</p>
                
                <h5>Recent Attendance</h5>
                <div class="attendance-summary">
                    <span class="status-badge status-present">Present: 85%</span>
                    <span class="status-badge status-absent">Absent: 15%</span>
                </div>
                
                <h5>Fee Status</h5>
                <div class="fee-summary">
                    <span class="status-badge status-paid">Paid: ₹5,000</span>
                    <span class="status-badge status-pending">Pending: ₹1,000</span>
                </div>
            </div>
        `;
    } else {
        studentInfo.innerHTML = '<p>No student information found for this account.</p>';
    }
}

// Dashboard Functions
function updateDashboard() {
    const studentsCountEl = document.getElementById('total-students');
    if (studentsCountEl) studentsCountEl.textContent = students.length;
    const teachersCountEl = document.getElementById('total-teachers');
    if (teachersCountEl) teachersCountEl.textContent = teachers.length;

    // Attendance rate for today
    const todayAttendance = attendance.filter(a => a.date === currentDate);
    const totalStudentsNum = students.length;
    const presentStudents = todayAttendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalStudentsNum > 0 ? Math.round((presentStudents / totalStudentsNum) * 100) : 0;
    const attendanceRateEl = document.getElementById('attendance-rate');
    if (attendanceRateEl) attendanceRateEl.textContent = attendanceRate + '%';

    // Monthly Fee Collection from payments (fallback to fee structure sum)
    const now = new Date();
    let monthlyFeeCollection = 0;
    try {
        if (typeof feePayments !== 'undefined' && Array.isArray(feePayments)) {
            monthlyFeeCollection = feePayments.filter(p => {
                const d = new Date(p.paymentDate);
                return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
            }).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        }
        if (!monthlyFeeCollection && Array.isArray(fees)) {
            monthlyFeeCollection = fees.reduce((total, fee) => total + (Number(fee.amount) || 0), 0);
        }
    } catch (e) { /* ignore */ }
    const feeEl = document.getElementById('fee-collection');
    if (feeEl) feeEl.textContent = '₹' + monthlyFeeCollection.toLocaleString();
}

// Utility Functions
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * Generate a student ID based on name and admission year.
 * Format: up to 3 letters from surname or name initials (uppercase) + YYYY + optional sequence
 * Example: "John Doe", 2025 => DOE2025 or JOH2025; if collision, append 001 etc.
 */
function generateStudentIdFromName(name, admissionDate) {
    const baseYear = (() => {
        const d = new Date(admissionDate);
        if (!isNaN(d.getFullYear())) return String(d.getFullYear());
        return String(new Date().getFullYear());
    })();

    if (!name || !name.trim()) name = 'STU';
    const parts = name.trim().split(/\s+/);
    let letters = '';
    if (parts.length > 1) {
        // Use surname if available
        const surname = parts[parts.length - 1];
        letters = surname.substring(0, 3).toUpperCase();
    } else {
        letters = parts[0].substring(0, 3).toUpperCase();
    }
    // Fallback to first three chars
    letters = letters.padEnd(3, 'X').substring(0,3);

    let candidate = `${letters}${baseYear}`;

    // Ensure uniqueness among existing students
    const existing = students || loadData('students') || [];
    if (!existing.find(s => s.id === candidate)) return candidate;

    // If collision, append sequence number
    let seq = 1;
    while (true) {
        const seqStr = String(seq).padStart(3, '0');
        const tryId = `${candidate}${seqStr}`;
        if (!existing.find(s => s.id === tryId)) return tryId;
        seq++;
        if (seq > 9999) break; // safety
    }
    // Fallback
    return candidate + generateId();
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alertDiv, mainContent.firstChild);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

// Load sample data
function loadSampleData() {
    // Load existing data or initialize with sample data
    students = loadData('students');
    teachers = loadData('teachers');
    classes = loadData('classes');
    attendance = loadData('attendance');
    exams = loadData('exams');
    fees = loadData('fees');
    feePayments = loadData('feePayments');
    notices = loadData('notices');
    // books/routes removed
    
    // Add sample data if none exists
    if (students.length === 0) {
        students = [
            {
                id: 'STU001',
                name: 'John Doe',
                class: '10',
                section: 'A',
                roll: '101',
                dob: '2008-05-15',
                gender: 'Male',
                address: '123 Main Street, City',
                guardianName: 'Robert Doe',
                guardianRelation: 'Father',
                guardianPhone: '9876543210',
                guardianEmail: 'robert@email.com',
                previousSchool: 'ABC School',
                admissionDate: '2023-04-01',
                status: 'Active'
            },
            {
                id: 'STU002',
                name: 'Jane Smith',
                class: '10',
                section: 'A',
                roll: '102',
                dob: '2008-07-20',
                gender: 'Female',
                address: '456 Oak Avenue, City',
                guardianName: 'Mary Smith',
                guardianRelation: 'Mother',
                guardianPhone: '9876543211',
                guardianEmail: 'mary@email.com',
                previousSchool: 'XYZ School',
                admissionDate: '2023-04-01',
                status: 'Active'
            }
        ];
        saveData('students', students);
    }
    
    if (classes.length === 0) {
        classes = [
            {
                id: 'CLS001',
                name: '10',
                section: 'A',
                teacherId: 'TCH001',
                teacherName: 'Dr. Sarah Johnson',
                room: 'Room 10A',
                floor: '2nd Floor',
                maxStrength: 40,
                currentStudents: 2,
                startTime: '08:00',
                endTime: '14:00',
                subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Physics', 'Chemistry', 'Biology'],
                description: 'Class 10A - Science Stream',
                status: 'Active',
                createdAt: '2024-01-01T08:00:00Z'
            }
        ];
        saveData('classes', classes);
    }
    
    if (teachers.length === 0) {
        teachers = [
            {
                id: 'TCH001',
                name: 'Dr. Sarah Johnson',
                email: 'sarah.johnson@school.com',
                phone: '9876543220',
                gender: 'Female',
                dob: '1985-03-15',
                joiningDate: '2020-06-01',
                subject: 'Mathematics',
                qualification: 'Ph.D',
                experience: 8,
                salary: 45000,
                assignedClasses: ['10', '11', '12'],
                address: '123 Teacher Lane, Education City',
                emergencyContact: '9876543221',
                designation: 'Head of Department',
                status: 'Active',
                createdAt: '2020-06-01T08:00:00Z'
            },
            {
                id: 'TCH002',
                name: 'Mr. Michael Brown',
                email: 'michael.brown@school.com',
                phone: '9876543222',
                gender: 'Male',
                dob: '1988-07-22',
                joiningDate: '2021-01-15',
                subject: 'Science',
                qualification: 'M.Sc',
                experience: 6,
                salary: 42000,
                assignedClasses: ['9', '10'],
                address: '456 Science Street, Knowledge Town',
                emergencyContact: '9876543223',
                designation: 'Senior Teacher',
                status: 'Active',
                createdAt: '2021-01-15T08:00:00Z'
            }
        ];
        saveData('teachers', teachers);
    }
    
    if (exams.length === 0) {
        exams = [
            {
                id: 'EXM001',
                name: 'Mid-Term Exam',
                type: 'Half-Yearly Exam',
                class: '10A',
                subject: 'Mathematics',
                date: '2024-01-15',
                time: '09:00',
                duration: 180,
                totalMarks: 100,
                passMarks: 33,
                room: 'Hall A',
                syllabus: 'Algebra, Geometry, Trigonometry (Chapters 1-8)',
                instructions: 'Students must bring their own calculators. No extra sheets allowed.',
                status: 'Scheduled',
                weightage: 30,
                createdAt: '2024-01-01T08:00:00Z'
            },
            {
                id: 'EXM002',
                name: 'Unit Test 1',
                type: 'Unit Test',
                class: '10A',
                subject: 'Science',
                date: '2024-01-20',
                time: '10:30',
                duration: 90,
                totalMarks: 50,
                passMarks: 17,
                room: 'Room 10A',
                syllabus: 'Physics: Motion and Force, Chemistry: Acids and Bases, Biology: Cell Structure',
                instructions: 'Multiple choice and short answer questions only.',
                status: 'Scheduled',
                weightage: 15,
                createdAt: '2024-01-01T08:00:00Z'
            }
        ];
        saveData('exams', exams);
    }
    
    if (fees.length === 0) {
        fees = [
            {
                id: 'FEE001',
                class: '10',
                type: 'Monthly Tuition',
                amount: 5000,
                dueDate: '2024-01-01'
            },
            {
                id: 'FEE002',
                class: '10',
                type: 'Library Fee',
                amount: 1000,
                dueDate: '2024-01-01'
            }
        ];
        saveData('fees', fees);
    }
    
    if (feePayments.length === 0) {
        feePayments = [
            {
                id: 'PAY001',
                studentId: 'STU001',
                feeType: 'Monthly Tuition',
                amount: 5000,
                paymentDate: '2024-01-15',
                method: 'Online Transfer',
                reference: 'TXN123456789',
                remarks: 'Monthly fee payment',
                createdAt: '2024-01-15T10:30:00Z'
            },
            {
                id: 'PAY002',
                studentId: 'STU002',
                feeType: 'Monthly Tuition',
                amount: 5000,
                paymentDate: '2024-01-16',
                method: 'Cash',
                reference: '',
                remarks: 'Cash payment at office',
                createdAt: '2024-01-16T14:20:00Z'
            }
        ];
        saveData('feePayments', feePayments);
    }
    
    if (notices.length === 0) {
        notices = [
            {
                id: 'NTS001',
                title: 'School Annual Sports Day',
                type: 'General',
                priority: 'High',
                date: currentDate,
                content: 'Dear parents and students,\n\nWe are pleased to announce the Annual Sports Day scheduled on next Saturday. Please ensure students come in proper sports uniform.\n\nRegards,\nSchool Administration',
                validity: null,
                recipients: 'All Students & Parents',
                sendMethods: 'Portal, Email',
                reminder: '1day',
                status: 'Sent',
                createdAt: new Date().toISOString(),
                sentAt: new Date().toISOString()
            },
            {
                id: 'NTS002',
                title: 'Examination Schedule - Class 10',
                type: 'Academic',
                priority: 'Normal',
                date: currentDate,
                content: 'Please find attached the examination schedule for Class 10. Students should prepare accordingly and check the notice board for updates.',
                validity: null,
                recipients: 'Class 10',
                sendMethods: 'Portal',
                reminder: '3days',
                status: 'Sent',
                createdAt: new Date().toISOString(),
                sentAt: new Date().toISOString()
            }
        ];
        saveData('notices', notices);
    }
    
    // books/routes samples removed
}
