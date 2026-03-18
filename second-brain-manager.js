// ฟังก์ชั่นสำหรับจัดการ Second Brain ที่ใช้งานได้จริง
class SecondBrainManager {
    constructor() {
        this.apiBase = '/api';
        this.files = ['IDEAS.md', 'KNOWLEDGE.md', 'TASKS.md', 'CONNECTIONS.md'];
    }

    // แสดง loading
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'block';
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    // แสดงข้อความแจ้งเตือน
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed`;
        toast.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
        `;
        document.body.appendChild(toast);
        
        // ซ่อนอัตโนมัติใน 3 วินาที
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }

    // อ่านไฟล์
    async readFile(filename) {
        this.showLoading();
        try {
            const response = await fetch(`${this.apiBase}/md/read?path=${encodeURIComponent(filename)}`, {
                headers: {
                    'Authorization': 'Bearer openclaw-dashboard-token'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.text();
            this.hideLoading();
            this.showFileContent(filename, data);
        } catch (error) {
            console.error('Error reading file:', error);
            this.hideLoading();
            this.showToast(`ไม่สามารถอ่านไฟล์ ${filename} ได้: ${error.message}`, 'error');
        }
    }

    // แสดงเนื้อหาไฟล์
    showFileContent(filename, content) {
        // สร้าง modal สำหรับแสดงเนื้อหา
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.cssText = 'display: block; background: rgba(0,0,0,0.5);';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-file-alt me-2"></i>
                            ${filename}
                        </h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; max-height: 60vh; overflow-y: auto;">
                            <pre style="white-space: pre-wrap; font-family: 'Kanit', sans-serif; font-size: 14px; line-height: 1.6;">${content}</pre>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">ปิด</button>
                        <button type="button" class="btn btn-primary" onclick="secondBrain.editFile('${filename}')">
                            <i class="fas fa-edit me-1"></i>แก้ไข
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // แก้ไขไฟล์
    editFile(filename) {
        this.readFileForEdit(filename);
    }

    // อ่านไฟล์เพื่อแก้ไข
    async readFileForEdit(filename) {
        this.showLoading();
        try {
            const response = await fetch(`${this.apiBase}/md/read?path=${encodeURIComponent(filename)}`, {
                headers: {
                    'Authorization': 'Bearer openclaw-dashboard-token'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.text();
            this.hideLoading();
            this.showEditForm(filename, data);
        } catch (error) {
            console.error('Error reading file for edit:', error);
            this.hideLoading();
            this.showToast(`ไม่สามารถอ่านไฟล์ ${filename} สำหรับแก้ไขได้: ${error.message}`, 'error');
        }
    }

    // แสดงฟอร์มแก้ไข
    showEditForm(filename, content) {
        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.cssText = 'display: block; background: rgba(0,0,0,0.5);';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-edit me-2"></i>
                            แก้ไข ${filename}
                        </h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <textarea id="edit-content" class="form-control" rows="20" style="font-family: 'Kanit', sans-serif; font-size: 14px; line-height: 1.6;">${content}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">ยกเลิก</button>
                        <button type="button" class="btn btn-success" onclick="secondBrain.saveFile('${filename}')">
                            <i class="fas fa-save me-1"></i>บันทึก
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // บันทึกไฟล์
    async saveFile(filename) {
        const content = document.getElementById('edit-content').value;
        if (!content) {
            this.showToast('กรุณากรอกข้อมูล', 'error');
            return;
        }

        this.showLoading();
        try {
            const response = await fetch(`${this.apiBase}/md/write`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer openclaw-dashboard-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: filename,
                    content: content
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            this.hideLoading();
            
            // ปิด modal
            const modal = document.querySelector('.modal.show');
            if (modal) {
                modal.remove();
            }
            
            this.showToast(`บันทึก ${filename} สำเร็จ`, 'success');
        } catch (error) {
            console.error('Error saving file:', error);
            this.hideLoading();
            this.showToast(`ไม่สามารถบันทึก ${filename} ได้: ${error.message}`, 'error');
        }
    }

    // เพิ่มเนื้อหาใหม่
    addNewContent(type) {
        const templates = {
            'IDEAS': `## ไอเดียใหม่

### 🚀 ชื่อไอเดีย
- **คำอธิบาย:** อธิบายไอเดียนี้สั้นๆ
- **ประโยชน์:** บอกประโยชน์ที่คาดว่าจะได้รับ
- **ขั้นตอน:** วางแผนการดำเนินการ

### 💡 รายละเอียดเพิ่มเติม
เพิ่มรายละเอียดเพิ่มเติมที่นี่...

---

*เพิ่มเมื่อ: ${new Date().toLocaleDateString('th-TH')}*`,
            'KNOWLEDGE': `## ความรู้ใหม่

### 📚 หัวข้อ
- **ประเภท:** เทคโนโลยี / การออกแบบ / อื่นๆ
- **แหล่งที่มา:** ที่ไหนมา
- **ความสำคัญ:** ทำไมถึงสำคัญ

### 🔍 รายละเอียด
เพิ่มรายละเอียดความรู้ที่นี่...

### 💡 การนำไปใช้
- **ที่ใด:** จะนำไปใช้ที่ไหน
- **อย่างไร:** จะนำไปใช้อย่างไร
- **ผลลัพธ์:** คาดว่าจะได้ผลอะไร

---

*เพิ่มเมื่อ: ${new Date().toLocaleDateString('th-TH')}*`,
            'TASKS': `## งานใหม่

### 🎯 ชื่องาน
- **ความสำคัญ:** สูง / กลาง / ต่ำ
- **กำหนดเสร็จ:** วันที่เสร็จ (ถ้ามี)
- **ผู้รับผิดชอบ:** ชื่อผู้รับผิดชอบ

### 📋 รายละเอียดงาน
เพิ่มรายละเอียดงานที่นี่...

### ✅ ขั้นตอนการทำ
1. ขั้นตอนที่ 1
2. ขั้นตอนที่ 2
3. ขั้นตอนที่ 3

### 📊 สถานะ
- [ ] ยังไม่เริ่ม
- [ ] กำลังทำ
- [ ] เสร็จแล้ว

---

*เพิ่มเมื่อ: ${new Date().toLocaleDateString('th-TH')}*`,
            'CONNECTIONS': `## การเชื่อมโยงใหม่

### 🔗 ชื่อการเชื่อมโยง
- **ประเภท:** ไอเดีย ↔️ งาน / ความรู้ ↔️ การใช้ / อื่นๆ
- **ความสำคัญ:** ทำไมถึงสำคัญ

### 📝 รายละเอียด
เพิ่มรายละเอียดการเชื่อมโยงที่นี่...

### 💡 ผลลัพธ์ที่คาดหวัง
- สิ่งที่คาดว่าจะเกิดขึ้นหลังการเชื่อมโยง
- ประโยชน์ที่จะได้รับ
- การพัฒนาที่จะเกิดขึ้น

---

*เพิ่มเมื่อ: ${new Date().toLocaleDateString('th-TH')}*`
        };

        const modal = document.createElement('div');
        modal.className = 'modal fade show';
        modal.style.cssText = 'display: block; background: rgba(0,0,0,0.5);';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-plus me-2"></i>
                            เพิ่ม${type}ใหม่
                        </h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <textarea id="new-content" class="form-control" rows="15" style="font-family: 'Kanit', sans-serif; font-size: 14px; line-height: 1.6;" placeholder="กรอกข้อมูล...">${templates[type]}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">ยกเลิก</button>
                        <button type="button" class="btn btn-primary" onclick="secondBrain.saveNewContent('${type}')">
                            <i class="fas fa-save me-1"></i>บันทึก
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // บันทึกเนื้อหาใหม่
    async saveNewContent(type) {
        const content = document.getElementById('new-content').value;
        if (!content) {
            this.showToast('กรุณากรอกข้อมูล', 'error');
            return;
        }

        this.showLoading();
        try {
            // อ่านไฟล์เดิมก่อน
            const response = await fetch(`${this.apiBase}/md/read?path=${type}.md`, {
                headers: {
                    'Authorization': 'Bearer openclaw-dashboard-token'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const existingContent = await response.text();
            const newContent = existingContent + '\n\n' + content;
            
            // บันทึกไฟล์
            const saveResponse = await fetch(`${this.apiBase}/md/write`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer openclaw-dashboard-token',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: `${type}.md`,
                    content: newContent
                })
            });
            
            if (!saveResponse.ok) {
                throw new Error(`HTTP error! status: ${saveResponse.status}`);
            }
            
            this.hideLoading();
            
            // ปิด modal
            const modal = document.querySelector('.modal.show');
            if (modal) {
                modal.remove();
            }
            
            this.showToast(`เพิ่ม${type}สำเร็จ`, 'success');
        } catch (error) {
            console.error('Error saving new content:', error);
            this.hideLoading();
            this.showToast(`ไม่สามารถเพิ่ม${type}ได้: ${error.message}`, 'error');
        }
    }
}

// สร้าง instance สากล
const secondBrain = new SecondBrainManager();

// ฟังก์ชั่นสำหรับเรียกใช้จาก HTML
function openFile(filename) {
    secondBrain.readFile(filename);
}

function addNewIdea() {
    secondBrain.addNewContent('IDEAS');
}

function addNewKnowledge() {
    secondBrain.addNewContent('KNOWLEDGE');
}

function addNewTask() {
    secondBrain.addNewContent('TASKS');
}

function addNewConnection() {
    secondBrain.addNewContent('CONNECTIONS');
}

// เพิ่ม CSS สำหรับ animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .modal.show {
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);