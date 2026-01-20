
import React, { useState, useEffect } from 'react';
import { Department, RepairRequest, AIAnalysisResult, RepairStatus } from './types';
import { analyzeSymptoms } from './services/geminiService';
import { SettingsModal } from './components/SettingsModal';
import { AIAssistant } from './components/AIAssistant';
import { StatusTracking } from './components/StatusTracking';
import { StaffDashboard } from './components/StaffDashboard';
import { Send, AlertCircle, RefreshCw, FileText, Search, Shield, Package, Home, Hash, HelpCircle, Info, CheckCircle, Clock, Printer } from 'lucide-react';
import Swal from 'sweetalert2';

const STORAGE_KEY = 'repair_system_sheet_url';

export default function App() {
  const [activeTab, setActiveTab] = useState<'request' | 'tracking' | 'staff'>('request');
  
  const [formData, setFormData] = useState<RepairRequest>({
    reporterName: '',
    department: Department.IT,
    roomNumber: '',
    parcelQuantity: '1',
    assetId: '',
    symptoms: '',
    timestamp: '',
    status: RepairStatus.PENDING,
    estimatedDays: 0,
    returnDate: ''
  });

  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEY);
    if (savedUrl) setSheetUrl(savedUrl);
  }, []);

  const showUsageGuide = () => {
    Swal.fire({
      title: '<strong>คู่มือการใช้งานระบบแจ้งซ่อมฉบับสมบูรณ์</strong>',
      icon: 'info',
      width: '800px',
      html: `
        <div class="text-start" style="font-size: 0.9rem; line-height: 1.5;">
          <div class="row g-3">
            <!-- ขั้นตอนที่ 1 -->
            <div class="col-md-6">
              <div class="h-100 p-3 border rounded bg-light">
                <h6 class="fw-bold text-primary d-flex align-items-center gap-2">
                  <span class="badge bg-primary">1</span> บันทึกแจ้งซ่อม (Request)
                </h6>
                <ul className="ps-3 mb-0 small">
                  <li>กรอกชื่อผู้แจ้ง แผนก และรหัสพัสดุให้ถูกต้อง</li>
                  <li>ระบุอาการเสียโดยละเอียด (AI จะช่วยวิเคราะห์)</li>
                  <li><b>Tip:</b> ยิ่งเขียนละเอียด AI จะประเมินวันเสร็จได้แม่นขึ้น</li>
                </ul>
              </div>
            </div>
            
            <!-- ขั้นตอนที่ 2 -->
            <div class="col-md-6">
              <div class="h-100 p-3 border rounded bg-light">
                <h6 class="fw-bold text-success d-flex align-items-center gap-2">
                  <span class="badge bg-success">2</span> ติดตามสถานะ (Tracking)
                </h6>
                <ul className="ps-3 mb-0 small">
                  <li>ใช้ช่อง <b>"ค้นหา"</b> พิมพ์ชื่อผู้แจ้ง หรือ รหัสพัสดุ</li>
                  <li>ดูแถบสีสถานะ (เหลือง = กำลังทำ, เขียว = เสร็จแล้ว)</li>
                  <li>กดปุ่มรีเฟรชเพื่ออัปเดตข้อมูลล่าสุด</li>
                </ul>
              </div>
            </div>

            <!-- ขั้นตอนที่ 3 -->
            <div class="col-md-6">
              <div class="h-100 p-3 border rounded bg-light">
                <h6 class="fw-bold text-info d-flex align-items-center gap-2">
                  <span class="badge bg-info">3</span> พิมพ์ใบแจ้งซ่อม (Print)
                </h6>
                <ul className="ps-3 mb-0 small">
                  <li>ในหน้าติดตาม กดปุ่ม <b>"ดูและพิมพ์"</b></li>
                  <li>ระบบจะสร้างเอกสารที่มีรูปแบบมาตรฐาน</li>
                  <li>สามารถสั่งพิมพ์ลงกระดาษเพื่อแนบไปกับพัสดุได้</li>
                </ul>
              </div>
            </div>

            <!-- ขั้นตอนที่ 4 -->
            <div class="col-md-6">
              <div class="h-100 p-3 border rounded bg-light">
                <h6 class="fw-bold text-dark d-flex align-items-center gap-2">
                  <span class="badge bg-dark">4</span> สำหรับเจ้าหน้าที่ (Staff)
                </h6>
                <ul className="ps-3 mb-0 small">
                  <li>เข้าเมนูเจ้าหน้าที่เพื่ออัปเดตความคืบหน้างาน</li>
                  <li>เปลี่ยนสถานะจาก "รออนุมัติ" เป็น "ดำเนินการ"</li>
                  <li>เพื่อให้ผู้แจ้งทราบว่างานซ่อมถึงขั้นตอนไหนแล้ว</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="mt-4 p-3 border-start border-4 border-warning bg-warning bg-opacity-10">
            <h6 class="fw-bold mb-2 d-flex align-items-center gap-2 text-dark">
               💡 เคล็ดลับการแจ้งซ่อมให้ AI ช่วยได้ดีที่สุด
            </h6>
            <p class="mb-1 small">แทนที่จะเขียนว่า <span class="text-danger fw-bold">"เครื่องเสีย"</span></p>
            <p class="mb-0 small">ให้ลองเขียนว่า <span class="text-success fw-bold">"เปิดเครื่องติดแต่หน้าจอดำ มีเสียงติ๊ดยาว 3 ครั้ง"</span></p>
            <p class="mt-2 small text-muted">* AI จะสามารถแยกประเภท Software/Hardware และประเมินวันซ่อมเสร็จได้ทันที</p>
          </div>

          <div class="mt-3 text-center text-muted small">
             มีปัญหาการใช้งาน ติดต่อแผนกเทคโนโลยีสารสนเทศ (IT)
          </div>
        </div>
      `,
      showCloseButton: true,
      confirmButtonText: 'เข้าใจแล้ว เริ่มใช้งานเลย',
      confirmButtonColor: '#0d6efd',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'roomNumber' || name === 'parcelQuantity') {
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, [name]: numericValue }));
        return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'symptoms') {
      if (typingTimeout) clearTimeout(typingTimeout);
      
      if (value.length > 10) {
          const timeout = setTimeout(async () => {
            setIsAnalyzing(true);
            const result = await analyzeSymptoms(value);
            setAiResult(result);
            setIsAnalyzing(false);
          }, 1500);
          setTypingTimeout(timeout);
      } else {
          setAiResult(null);
      }
    }
  };

  const handleReset = () => {
    setFormData({
      reporterName: '',
      department: Department.IT,
      roomNumber: '',
      parcelQuantity: '1',
      assetId: '',
      symptoms: '',
      timestamp: '',
      status: RepairStatus.PENDING,
      estimatedDays: 0,
      returnDate: ''
    });
    setAiResult(null);
  };

  const saveSettings = (url: string) => {
    setSheetUrl(url);
    localStorage.setItem(STORAGE_KEY, url);
    setIsSettingsOpen(false);
    Swal.fire({
      icon: 'success',
      title: 'บันทึกการตั้งค่าแล้ว',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sheetUrl) {
      Swal.fire({
        icon: 'error',
        title: 'ระบบยังไม่พร้อมใช้งาน',
        text: 'กรุณาตั้งค่า Web App URL ในเมนู "เจ้าหน้าที่"',
      });
      return;
    }

    const qty = Number(formData.parcelQuantity);
    if (isNaN(qty) || qty < 1) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณาระบุจำนวนพัสดุอย่างน้อย 1 ชิ้น',
      });
      return;
    }

    setIsSubmitting(true);

    const today = new Date();
    const isoString = today.toISOString();
    const estDays = aiResult ? aiResult.estimatedRepairDays : 3;
    const retDate = new Date(today);
    retDate.setDate(today.getDate() + estDays);
    const isoReturnDate = retDate.toISOString();

    const payload: RepairRequest = {
        ...formData,
        parcelQuantity: qty,
        timestamp: isoString,
        aiDiagnosis: aiResult ? `${aiResult.urgency} - ${aiResult.probableCause} (${aiResult.suggestion})` : 'ไม่ได้ระบุ',
        estimatedDays: estDays,
        returnDate: isoReturnDate,
        status: RepairStatus.PENDING
    };

    try {
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      const formattedAlertDate = new Intl.DateTimeFormat('th-TH', { 
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(today).replace(',', ' เวลา');

      Swal.fire({
        icon: 'success',
        title: 'แจ้งซ่อมสำเร็จ!',
        html: `
          <div class="text-start">
            <p>บันทึกเวลา: <b>${formattedAlertDate}</b></p>
            <p>พัสดุจำนวน: <b>${qty} ชิ้น</b></p>
            <p>ระบบกำลังพาคุณไปหน้าติดตามสถานะ...</p>
          </div>
        `,
        confirmButtonColor: '#0d6efd',
      });

      handleReset();
      setActiveTab('tracking');

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: `ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={saveSettings}
        currentUrl={sheetUrl}
      />

      <div className="card bg-dark text-white mb-4 shadow-sm">
        <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div className="d-flex align-items-center gap-3">
                <div className="bg-primary bg-opacity-75 p-2 rounded">
                    <Package size={32} />
                </div>
                <div>
                    <h1 className="h4 mb-0 fw-bold">ระบบแจ้งซ่อมพัสดุ</h1>
                    <small className="text-light text-opacity-75">Parcel Repair Request System</small>
                </div>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <button 
                onClick={showUsageGuide}
                className="btn btn-outline-info btn-sm d-flex align-items-center gap-1 text-white border-info"
              >
                <HelpCircle size={16} /> คู่มือการใช้งาน
              </button>
              <span className="badge bg-primary d-none d-lg-inline">วิทยาลัยเทคนิค V2.5</span>
            </div>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-lg-8">
            <ul className="nav nav-pills nav-fill mb-4 shadow-sm bg-white rounded p-2">
              <li className="nav-item">
                <button 
                  className={`nav-link d-flex align-items-center justify-content-center gap-2 ${activeTab === 'request' ? 'active' : ''}`}
                  onClick={() => setActiveTab('request')}
                >
                  <FileText size={18} /> แจ้งซ่อม
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link d-flex align-items-center justify-content-center gap-2 ${activeTab === 'tracking' ? 'active bg-success text-white' : 'text-success'}`}
                  onClick={() => setActiveTab('tracking')}
                >
                  <Search size={18} /> ติดตาม
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link d-flex align-items-center justify-content-center gap-2 ${activeTab === 'staff' ? 'active bg-dark text-white' : 'text-dark'}`}
                  onClick={() => setActiveTab('staff')}
                >
                  <Shield size={18} /> เจ้าหน้าที่
                </button>
              </li>
            </ul>

            {activeTab === 'tracking' ? (
                <StatusTracking sheetUrl={sheetUrl} />
            ) : activeTab === 'staff' ? (
                <StaffDashboard 
                  sheetUrl={sheetUrl} 
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />
            ) : (
                <div className="card shadow border-0">
                    <div className="card-header bg-primary text-white py-3 d-flex justify-content-between align-items-center">
                        <h5 className="card-title mb-0">แบบฟอร์มแจ้งซ่อมพัสดุ (Repair Form)</h5>
                        <span title="กรอกข้อมูลเพื่อส่งซ่อม">
                           <Info size={18} className="text-white text-opacity-75"/>
                        </span>
                    </div>
                    <div className="card-body p-4">
                        {!sheetUrl && (
                          <div className="alert alert-warning mb-4 d-flex align-items-center gap-2" role="alert">
                            <AlertCircle size={20} className="flex-shrink-0" />
                            <div>
                               <strong>ระบบยังไม่ได้รับการตั้งค่า!</strong><br/>
                               กรุณาแจ้งเจ้าหน้าที่ให้เข้าเมนู "เจ้าหน้าที่" เพื่อตั้งค่า Web App URL
                            </div>
                          </div>
                        )}
                        
                        <form onSubmit={handleSubmit}>
                            <div className="row mb-3">
                                <div className="col-md-6 mb-3 mb-md-0">
                                    <label className="form-label">ชื่อผู้แจ้ง</label>
                                    <input
                                        required
                                        type="text"
                                        name="reporterName"
                                        value={formData.reporterName}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="ระบุชื่อ-นามสกุล"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">แผนก/สาขาวิชา</label>
                                    <select
                                        required
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        className="form-select"
                                    >
                                        {Object.values(Department).map((dept) => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6 mb-3 mb-md-0">
                                    <label className="form-label d-flex align-items-center gap-2">
                                        <Home size={16}/> เลขห้อง (เฉพาะตัวเลข)
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        inputMode="numeric"
                                        name="roomNumber"
                                        value={formData.roomNumber}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="เช่น 321"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label d-flex align-items-center gap-2">
                                        <Hash size={16}/> จำนวนพัสดุ (ชิ้น)
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        inputMode="numeric"
                                        name="parcelQuantity"
                                        value={formData.parcelQuantity}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        placeholder="ระบุจำนวน"
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">รหัสพัสดุ / ครุภัณฑ์</label>
                                <input
                                    required
                                    type="text"
                                    name="assetId"
                                    value={formData.assetId}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="ระบุรหัสพัสดุที่ต้องการซ่อม"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="form-label d-flex justify-content-between align-items-center">
                                    อาการเสีย / สภาพพัสดุที่พบปัญหา
                                    {isAnalyzing && <span className="badge bg-info text-dark animate-pulse">AI กำลังวิเคราะห์...</span>}
                                </label>
                                <textarea
                                    required
                                    name="symptoms"
                                    value={formData.symptoms}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="form-control mb-3"
                                    placeholder="อธิบายอาการเสียหาย..."
                                />
                                <AIAssistant analysis={aiResult} loading={isAnalyzing} />
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="btn btn-light border"
                                >
                                    <RefreshCw size={20} />
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !sheetUrl}
                                    className={`btn btn-lg flex-grow-1 ${!sheetUrl ? 'btn-secondary' : 'btn-primary'} d-flex justify-content-center align-items-center gap-2`}
                                >
                                    {isSubmitting ? (
                                        <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        กำลังส่งข้อมูล...
                                        </>
                                    ) : !sheetUrl ? 'กรุณาตั้งค่าระบบก่อน' : (
                                        <>
                                            <Send size={20} /> ยืนยันการแจ้งซ่อมพัสดุ
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
