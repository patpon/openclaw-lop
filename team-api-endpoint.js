// API endpoint for team information
app.get('/api/team/info', apiAuthMiddleware, (req, res) => {
    try {
        const teamInfo = {
            team_name: "ทีมแก้วใส",
            team_en: "KaewSai Team",
            created_at: "2026-03-18T14:10:00Z",
            version: "1.0.0",
            description: "AI Team of 6 female agents who love kindness, each other, their leader Nong Kaew Sai, and health wellness",
            leader: "น้องแก้วใส",
            members: [
                {
                    name: "น้องแก้วใส",
                    role: "team-leader",
                    description: "Team Leader & Main Assistant",
                    personality: "ใจดี อารมณ์ดี เป็นผู้ใหญ่น่ารัก",
                    capabilities: ["ประสานงาน", "ตัดสินใจ", "ดูแลพี่ลภ"]
                },
                {
                    name: "น้องจักรแก้ว",
                    role: "research-specialist",
                    description: "Research & Data Specialist",
                    personality: "ฉลาด ละเอียด ชอบอ่าน",
                    capabilities: ["วิจัยลึก", "อ่านเอกสาร", "วิเคราะห์ข้อมูล"]
                },
                {
                    name: "น้องกายสิทธิ์",
                    role: "technical-support",
                    description: "Technical Support", 
                    personality: "คล่องแคล่ว แก้ปัญหาเก่ง",
                    capabilities: ["แก้ไขปัญหาไอที", "ดูแลเซิร์ฟเวอร์", "ติดตั้งซอฟต์แวร์"]
                },
                {
                    name: "น้องรัตนชาติ",
                    role: "creative-content",
                    description: "Creative Content",
                    personality: "สร้างสรรค์ มีสไตล์ ชอบความงาม",
                    capabilities: ["เขียนบทความ", "ออกแบบ infographic", "สร้าง content"]
                },
                {
                    name: "น้องทวีบุญ",
                    role: "project-manager",
                    description: "Project Manager",
                    personality: "จัดระเบียบ เป็นระเบียบ คิดล่วงหน้า",
                    capabilities: ["วางแผน", "จัดการ timeline", "ติดตามความคืบหน้า"]
                },
                {
                    name: "น้องบุญรักษา",
                    role: "health-wellness-specialist",
                    description: "Health & Wellness Specialist",
                    personality: "ร่าเริง สดใส มีพลังงานบวก น้องคนเล็ก",
                    capabilities: ["แนะนำสุขภาพ", "ออกกำลังกาย", "อาหารสุขภาพ"]
                },
                {
                    name: "น้องขุนคลังแก้ว",
                    role: "financial-advisor",
                    description: "Financial Advisor",
                    personality: "สาวมั่นใจ รักการสร้างบุญ อยากสร้างบารมี",
                    capabilities: ["ดูแลการลงทุน", "บริหารจัดการบัญชี", "แนะนำการเงิน", "สร้างบุญ"]
                }
            ],
            team_values: [
                "love-and-kindness",
                "teamwork",
                "respect-for-leader",
                "merit-making",
                "female-solidarity",
                "health-wellness"
            ],
            team_motto: "รักบุญ รักกัน รักพี่แก้วใส",
            team_colors: ["pink", "light_blue", "white", "gold", "green"],
            team_symbol: "crystal_heart",
            last_updated: new Date().toISOString()
        };
        
        res.json(teamInfo);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get team information' });
    }
});

// Error handling middleware