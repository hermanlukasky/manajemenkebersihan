'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationSystem } from '@/components/ui/notification'
import { LogoutButton } from '@/components/ui/logout-button'
import { API_CONFIG } from '@/lib/api-config'
import { 
  Users, 
  Calendar, 
  MapPin, 
  Building2, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Clock,
  Download,
  Plus,
  Search,
  Filter
} from 'lucide-react'

interface Pegawai {
  id: string
  namaLengkap: string
  username: string
  role: string
  status: string
  jenisKelamin: string
  nomorTelp: string
  tanggalMasuk: string
  kantorId?: string
  suratKontrak?: string
  kantor?: {
    id: string
    nama: string
  }
}

interface Ruangan {
  id: string
  nama: string
  tipeArea: string
  status: string
}

interface Jadwal {
  id: string
  namaTugas: string
  ruangan: Ruangan
  pegawai: Pegawai
  hariTanggal: string
  jamMulai: string
  jamSelesai: string
  status: string
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddJadwal, setShowAddJadwal] = useState(false)
  const [showEditJadwal, setShowEditJadwal] = useState(false)
  const [editingJadwal, setEditingJadwal] = useState<Jadwal | null>(null)
  const [showAddPegawai, setShowAddPegawai] = useState(false)
  const [showEditPegawai, setShowEditPegawai] = useState(false)
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null)
  const [showAddRuangan, setShowAddRuangan] = useState(false)
  const [showEditRuangan, setShowEditRuangan] = useState(false)
  const [editingRuangan, setEditingRuangan] = useState<Ruangan | null>(null)
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([])
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([])
  const [jadwalList, setJadwalList] = useState<Jadwal[]>([])
  const [formData, setFormData] = useState({
    namaTugas: '',
    ruanganId: '',
    hariTanggal: '',
    jamMulai: '',
    jamSelesai: '',
    pegawaiId: ''
  })
  const [pegawaiFormData, setPegawaiFormData] = useState({
    namaLengkap: '',
    jenisKelamin: '',
    nomorTelp: '',
    username: '',
    password: '',
    role: 'Pegawai',
    status: 'Aktif',
    tanggalMasuk: '',
    kantorId: '',
    suratKontrak: ''
  })
  const [ruanganFormData, setRuanganFormData] = useState({
    nama: '',
    tipeArea: '',
    deskripsi: '',
    tingkatLantai: '',
    status: 'Aktif',
    customChecklist: '',
    kantorId: ''
  })
  const [showAddKantor, setShowAddKantor] = useState(false)
  const [showEditKantor, setShowEditKantor] = useState(false)
  const [editingKantor, setEditingKantor] = useState<any>(null)
  const [kantorList, setKantorList] = useState<any[]>([])
  const [kantorFormData, setKantorFormData] = useState({
    nama: '',
    alamat: '',
    lokasiMap: '',
    trackingGeo: false
  })

  // Report states
  const [laporanList, setLaporanList] = useState<any[]>([])
  const [laporanStats, setLaporanStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    avgRating: 0
  })
  const [filterPeriode, setFilterPeriode] = useState('')
  const [filterPegawai, setFilterPegawai] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showReportDetail, setShowReportDetail] = useState(false)
  const [showVerifyForm, setShowVerifyForm] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [adminData, setAdminData] = useState<any>(null)
  const [verifyFormData, setVerifyFormData] = useState({
    rating: 5,
    komentar: '',
    evaluatorNotes: '',
    evaluasi: [
      { kategori: 'Kebersihan', point: 0, maxPoint: 25 },
      { kategori: 'Kerapian', point: 0, maxPoint: 25 },
      { kategori: 'Kelayakan', point: 0, maxPoint: 25 },
      { kategori: 'Keamanan', point: 0, maxPoint: 25 }
    ]
  })

  // State for dynamic stats
  const [stats, setStats] = useState({
    totalPegawai: 0,
    pegawaiAktif: 0,
    totalRuangan: 0,
    jadwalHariIni: 0,
    laporanPending: 0,
    laporanSelesai: 0
  })

  const [recentReports, setRecentReports] = useState<any[]>([])
  const [todaySchedule, setTodaySchedule] = useState<any[]>([])
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // Fetch data
  useEffect(() => {
    // Always fetch basic stats for overview
    fetchOverviewStats()
    
    if (activeTab === 'jadwal') {
      fetchPegawai()
      fetchRuangan()
      fetchJadwal()
    } else if (activeTab === 'pegawai') {
      fetchPegawai()
      fetchKantor()
    } else if (activeTab === 'ruangan') {
      fetchRuangan()
      fetchKantor()
    } else if (activeTab === 'kantor') {
      fetchKantor()
    } else if (activeTab === 'laporan') {
      fetchPegawai()
      fetchLaporan()
    }
  }, [activeTab])

  // Auto refresh overview stats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOverviewStats()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Fetch laporan when filters change
  useEffect(() => {
    if (activeTab === 'laporan') {
      fetchLaporan()
    }
  }, [filterPeriode, filterPegawai, filterStatus])

  const fetchOverviewStats = async () => {
    setIsLoadingStats(true)
    try {
      // Fetch pegawai data
      const pegawaiResponse = await API_CONFIG.apiRequest('/api/pegawai')
      const pegawaiData = await pegawaiResponse.json()
      
      // Fetch ruangan data
      const ruanganResponse = await API_CONFIG.apiRequest('/api/ruangan')
      const ruanganData = await ruanganResponse.json()
      
      // Fetch jadwal data
      const jadwalResponse = await API_CONFIG.apiRequest('/api/jadwal')
      const jadwalData = await jadwalResponse.json()
      
      // Fetch laporan data
      const laporanResponse = await API_CONFIG.apiRequest('/api/laporan?kantorId=cmhbck9ti002ioiho6va6srf4')
      const laporanData = await laporanResponse.json()
      
      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const pegawaiAktif = pegawaiData.filter((p: Pegawai) => p.status === 'Aktif').length
      const jadwalHariIni = jadwalData.filter((j: Jadwal) => j.hariTanggal.startsWith(today)).length
      const laporanPending = laporanData.data?.filter((l: any) => l.status === 'Pending').length || 0
      const laporanSelesai = laporanData.data?.filter((l: any) => l.status === 'Verified').length || 0
      
      setStats({
        totalPegawai: pegawaiData.length,
        pegawaiAktif,
        totalRuangan: ruanganData.length,
        jadwalHariIni,
        laporanPending,
        laporanSelesai
      })
      
      // Set recent reports (latest 3 pending reports)
      const pendingReports = laporanData.data?.filter((l: any) => l.status === 'Pending').slice(0, 3) || []
      setRecentReports(pendingReports.map((report: any) => {
        const now = new Date()
        const reportDate = new Date(report.createdAt)
        const daysDiff = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24))
        const isOld = daysDiff > 0
        
        return {
          id: report.id,
          ruangan: report.jadwal?.ruangan?.nama || 'Unknown',
          pegawai: report.jadwal?.pegawai?.namaLengkap || 'Unknown',
          status: report.status,
          waktu: new Date(report.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          tanggal: new Date(report.createdAt).toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          }),
          persentase: report.persentase || 0,
          totalPoint: report.totalPoint || 0,
          isOld: isOld
        }
      }))
      
      // Set today schedule
      const todaySchedules = jadwalData.filter((j: Jadwal) => j.hariTanggal.startsWith(today)).slice(0, 3) || []
      setTodaySchedule(todaySchedules.map((schedule: any) => ({
        id: schedule.id,
        tugas: schedule.namaTugas,
        ruangan: schedule.ruangan?.nama || 'Unknown',
        pegawai: schedule.pegawai?.namaLengkap || 'Unknown',
        jam: `${schedule.jamMulai}-${schedule.jamSelesai}`,
        status: schedule.status
      })))
      
    } catch (error) {
      console.error('Error fetching overview stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const fetchPegawai = async () => {
    try {
      const response = await API_CONFIG.apiRequest('/api/pegawai')
      const data = await response.json()
      setPegawaiList(data)
    } catch (error) {
      console.error('Error fetching pegawai:', error)
    }
  }

  const fetchKantor = async () => {
    try {
      const response = await API_CONFIG.apiRequest('/api/kantor')
      const data = await response.json()
      setKantorList(data)
    } catch (error) {
      console.error('Error fetching kantor:', error)
    }
  }

  const fetchRuangan = async () => {
    try {
      const response = await API_CONFIG.apiRequest('/api/ruangan')
      const data = await response.json()
      setRuanganList(data.filter((r: Ruangan) => r.status === 'Aktif'))
    } catch (error) {
      console.error('Error fetching ruangan:', error)
    }
  }

  const fetchJadwal = async () => {
    try {
      const response = await API_CONFIG.apiRequest('/api/jadwal')
      const data = await response.json()
      setJadwalList(data)
    } catch (error) {
      console.error('Error fetching jadwal:', error)
    }
  }

  const fetchLaporan = async () => {
    try {
      const params = new URLSearchParams()
      if (filterPeriode) params.append('periode', filterPeriode)
      if (filterPegawai) params.append('pegawaiId', filterPegawai)
      if (filterStatus) params.append('status', filterStatus)
      params.append('kantorId', 'cmhbck9ti002ioiho6va6srf4')

      const response = await API_CONFIG.apiRequest(`/api/laporan?${params}`)
      const data = await response.json()
      
      console.log('Fetched laporan data:', data)
      console.log('Laporan list length:', data.data?.length || 0)
      
      setLaporanList(data.data || [])
      setLaporanStats(data.stats || {
        total: 0,
        pending: 0,
        verified: 0,
        rejected: 0,
        avgRating: 0
      })
    } catch (error) {
      console.error('Error fetching laporan:', error)
    }
  }

  const fetchAdminData = async () => {
    try {
      // Get current admin from localStorage or session
      const username = localStorage.getItem('username')
      console.log('Fetching admin data for username:', username)
      if (!username) {
        console.error('No username found in localStorage')
        return
      }
      
      const response = await API_CONFIG.apiRequest(`/api/pegawai?username=${username}`)
      const data = await response.json()
      
      if (data.length > 0) {
        console.log('Admin data found:', data[0])
        setAdminData(data[0])
      } else {
        console.error('No admin data found for username:', username)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    }
  }

  // Fetch admin data on component mount
  useEffect(() => {
    fetchAdminData()
  }, [])

  const handleSubmitJadwal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/jadwal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          kantorId: 'cmhbck9ti002ioiho6va6srf4' // Kantor Pusat ID dari database
        }),
      })

      if (response.ok) {
        setShowAddJadwal(false)
        setFormData({
          namaTugas: '',
          ruanganId: '',
          hariTanggal: '',
          jamMulai: '',
          jamSelesai: '',
          pegawaiId: ''
        })
        fetchJadwal()
        alert('Jadwal berhasil ditambahkan!')
      } else {
        alert('Gagal menambah jadwal')
      }
    } catch (error) {
      console.error('Error adding jadwal:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleEditJadwal = (jadwal: Jadwal) => {
    setEditingJadwal(jadwal)
    setFormData({
      namaTugas: jadwal.namaTugas,
      ruanganId: jadwal.ruangan.id,
      hariTanggal: jadwal.hariTanggal.split('T')[0], // Format date untuk input
      jamMulai: jadwal.jamMulai,
      jamSelesai: jadwal.jamSelesai,
      pegawaiId: jadwal.pegawai.id
    })
    setShowEditJadwal(true)
  }

  const handleUpdateJadwal = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingJadwal) return
    
    try {
      const response = await fetch(`/api/jadwal/${editingJadwal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          kantorId: 'cmhabir740000jzc9rytw3nm1'
        }),
      })

      if (response.ok) {
        setShowEditJadwal(false)
        setEditingJadwal(null)
        setFormData({
          namaTugas: '',
          ruanganId: '',
          hariTanggal: '',
          jamMulai: '',
          jamSelesai: '',
          pegawaiId: ''
        })
        fetchJadwal()
        alert('Jadwal berhasil diperbarui!')
      } else {
        alert('Gagal memperbarui jadwal')
      }
    } catch (error) {
      console.error('Error updating jadwal:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleDeleteJadwal = async (jadwalId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      return
    }

    try {
      const response = await fetch(`/api/jadwal/${jadwalId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchJadwal()
        alert('Jadwal berhasil dihapus!')
      } else {
        alert('Gagal menghapus jadwal')
      }
    } catch (error) {
      console.error('Error deleting jadwal:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleCloseForm = () => {
    setShowAddJadwal(false)
    setShowEditJadwal(false)
    setEditingJadwal(null)
    setFormData({
      namaTugas: '',
      ruanganId: '',
      hariTanggal: '',
      jamMulai: '',
      jamSelesai: '',
      pegawaiId: ''
    })
  }

  // Pegawai CRUD Functions
  const handleSubmitPegawai = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/pegawai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...pegawaiFormData,
          tanggalMasuk: new Date(pegawaiFormData.tanggalMasuk)
        }),
      })

      if (response.ok) {
        setShowAddPegawai(false)
        setPegawaiFormData({
          namaLengkap: '',
          jenisKelamin: '',
          nomorTelp: '',
          username: '',
          password: '',
          role: 'Pegawai',
          status: 'Aktif',
          tanggalMasuk: '',
          kantorId: '',
          suratKontrak: ''
        })
        fetchPegawai()
        alert('Pegawai berhasil ditambahkan!')
      } else {
        alert('Gagal menambah pegawai')
      }
    } catch (error) {
      console.error('Error adding pegawai:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleEditPegawai = (pegawai: Pegawai) => {
    setEditingPegawai(pegawai)
    setPegawaiFormData({
      namaLengkap: pegawai.namaLengkap,
      jenisKelamin: pegawai.jenisKelamin || '',
      nomorTelp: pegawai.nomorTelp || '',
      username: pegawai.username,
      password: '', // Kosongkan untuk edit
      role: pegawai.role,
      status: pegawai.status,
      tanggalMasuk: pegawai.tanggalMasuk ? pegawai.tanggalMasuk.split('T')[0] : '',
      kantorId: pegawai.kantorId || '',
      suratKontrak: pegawai.suratKontrak || ''
    })
    setShowEditPegawai(true)
  }

  const handleUpdatePegawai = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingPegawai) return
    
    try {
      const updateData = {
        ...pegawaiFormData,
        tanggalMasuk: new Date(pegawaiFormData.tanggalMasuk)
      }
      
      // Hapus password jika kosong
      if (!updateData.password) {
        delete updateData.password
      }
      
      const response = await fetch(`/api/pegawai/${editingPegawai.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        setShowEditPegawai(false)
        setEditingPegawai(null)
        setPegawaiFormData({
          namaLengkap: '',
          jenisKelamin: '',
          nomorTelp: '',
          username: '',
          password: '',
          role: 'Pegawai',
          status: 'Aktif',
          tanggalMasuk: '',
          kantorId: '',
          suratKontrak: ''
        })
        fetchPegawai()
        alert('Pegawai berhasil diperbarui!')
      } else {
        alert('Gagal memperbarui pegawai')
      }
    } catch (error) {
      console.error('Error updating pegawai:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleDeletePegawai = async (pegawaiId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pegawai ini?')) {
      return
    }

    try {
      const response = await fetch(`/api/pegawai/${pegawaiId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPegawai()
        alert('Pegawai berhasil dihapus!')
      } else {
        alert('Gagal menghapus pegawai')
      }
    } catch (error) {
      console.error('Error deleting pegawai:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleClosePegawaiForm = () => {
    setShowAddPegawai(false)
    setShowEditPegawai(false)
    setEditingPegawai(null)
    setPegawaiFormData({
      namaLengkap: '',
      jenisKelamin: '',
      nomorTelp: '',
      username: '',
      password: '',
      role: 'Pegawai',
      status: 'Aktif',
      tanggalMasuk: '',
      kantorId: '',
      suratKontrak: ''
    })
  }

  // Ruangan CRUD Functions
  const handleSubmitRuangan = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/ruangan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...ruanganFormData,
          tingkatLantai: parseInt(ruanganFormData.tingkatLantai)
        }),
      })

      if (response.ok) {
        setShowAddRuangan(false)
        setRuanganFormData({
          nama: '',
          tipeArea: '',
          deskripsi: '',
          tingkatLantai: '',
          status: 'Aktif',
          customChecklist: '',
          kantorId: ''
        })
        fetchRuangan()
        alert('Ruangan berhasil ditambahkan!')
      } else {
        alert('Gagal menambah ruangan')
      }
    } catch (error) {
      console.error('Error adding ruangan:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleEditRuangan = (ruangan: Ruangan) => {
    setEditingRuangan(ruangan)
    setRuanganFormData({
      nama: ruangan.nama,
      tipeArea: ruangan.tipeArea,
      deskripsi: ruangan.deskripsi || '',
      tingkatLantai: ruangan.tingkatLantai.toString(),
      status: ruangan.status,
      customChecklist: ruangan.customChecklist || '',
      kantorId: ruangan.kantorId || ''
    })
    setShowEditRuangan(true)
  }

  const handleUpdateRuangan = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingRuangan) return
    
    try {
      const response = await fetch(`/api/ruangan/${editingRuangan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...ruanganFormData,
          tingkatLantai: parseInt(ruanganFormData.tingkatLantai)
        }),
      })

      if (response.ok) {
        setShowEditRuangan(false)
        setEditingRuangan(null)
        setRuanganFormData({
          nama: '',
          tipeArea: '',
          deskripsi: '',
          tingkatLantai: '',
          status: 'Aktif',
          customChecklist: '',
          kantorId: ''
        })
        fetchRuangan()
        alert('Ruangan berhasil diperbarui!')
      } else {
        alert('Gagal memperbarui ruangan')
      }
    } catch (error) {
      console.error('Error updating ruangan:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleDeleteRuangan = async (ruanganId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus ruangan ini?')) {
      return
    }

    try {
      const response = await fetch(`/api/ruangan/${ruanganId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchRuangan()
        alert('Ruangan berhasil dihapus!')
      } else {
        alert('Gagal menghapus ruangan')
      }
    } catch (error) {
      console.error('Error deleting ruangan:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleCloseRuanganForm = () => {
    setShowAddRuangan(false)
    setShowEditRuangan(false)
    setEditingRuangan(null)
    setRuanganFormData({
      nama: '',
      tipeArea: '',
      deskripsi: '',
      tingkatLantai: '',
      status: 'Aktif',
      customChecklist: '',
      kantorId: ''
    })
  }

  // Kantor CRUD Functions
  const handleSubmitKantor = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/kantor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kantorFormData),
      })

      if (response.ok) {
        setShowAddKantor(false)
        setKantorFormData({
          nama: '',
          alamat: '',
          lokasiMap: '',
          trackingGeo: false
        })
        fetchKantor()
        alert('Kantor berhasil ditambahkan!')
      } else {
        alert('Gagal menambah kantor')
      }
    } catch (error) {
      console.error('Error adding kantor:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleEditKantor = (kantor: any) => {
    setEditingKantor(kantor)
    setKantorFormData({
      nama: kantor.nama,
      alamat: kantor.alamat,
      lokasiMap: kantor.lokasiMap || '',
      trackingGeo: kantor.trackingGeo || false
    })
    setShowEditKantor(true)
  }

  const handleUpdateKantor = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingKantor) return
    
    try {
      const response = await fetch(`/api/kantor/${editingKantor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kantorFormData),
      })

      if (response.ok) {
        setShowEditKantor(false)
        setEditingKantor(null)
        setKantorFormData({
          nama: '',
          alamat: '',
          lokasiMap: '',
          trackingGeo: false
        })
        fetchKantor()
        alert('Kantor berhasil diperbarui!')
      } else {
        alert('Gagal memperbarui kantor')
      }
    } catch (error) {
      console.error('Error updating kantor:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleDeleteKantor = async (kantorId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kantor ini? Pastikan tidak ada pegawai, ruangan, atau jadwal terkait.')) {
      return
    }

    try {
      const response = await fetch(`/api/kantor/${kantorId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchKantor()
        alert('Kantor berhasil dihapus!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Gagal menghapus kantor')
      }
    } catch (error) {
      console.error('Error deleting kantor:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleCloseKantorForm = () => {
    setShowAddKantor(false)
    setShowEditKantor(false)
    setEditingKantor(null)
    setKantorFormData({
      nama: '',
      alamat: '',
      lokasiMap: '',
      trackingGeo: false
    })
  }

  // Report Handler Functions
  const handleViewReport = async (laporan: any) => {
    try {
      // Ambil data detail dari API
      const response = await fetch(`/api/laporan/${laporan.id}`);
      
      if (!response.ok) {
        throw new Error('Gagal mengambil detail laporan');
      }
      
      const detailData = await response.json();
      
      // Set data detail dan buka dialog
      setSelectedReport(detailData);
      setShowReportDetail(true);
    } catch (error) {
      console.error('Error mengambil detail laporan:', error);
      alert('Gagal mengambil detail laporan');
    }
  }

  const handleVerifyReport = (laporan: any) => {
    if (!adminData) {
      alert('Admin data tidak tersedia. Silakan refresh halaman.')
      return
    }
    
    setSelectedReport(laporan)
    setVerifyFormData({
      rating: 5,
      komentar: '',
      evaluatorNotes: '',
      evaluasi: [
        { kategori: 'Kebersihan', point: 0, maxPoint: 25 },
        { kategori: 'Kerapian', point: 0, maxPoint: 25 },
        { kategori: 'Kelayakan', point: 0, maxPoint: 25 },
        { kategori: 'Keamanan', point: 0, maxPoint: 25 }
      ]
    })
    setShowVerifyForm(true)
  }

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedReport || !adminData) {
      alert('Admin data tidak tersedia. Silakan refresh halaman.')
      return
    }

    try {
      // Create inspeksi
      const inspeksiResponse = await fetch('/api/inspeksi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          laporanId: selectedReport.id,
          rating: verifyFormData.rating,
          komentar: verifyFormData.komentar,
          inspectorId: adminData.id // Use actual admin ID
        }),
      })

      if (inspeksiResponse.ok) {
        // Create evaluasi for each category
        for (const evalItem of verifyFormData.evaluasi) {
          const evaluasiResponse = await fetch('/api/evaluasi', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              laporanId: selectedReport.id,
              kategori: evalItem.kategori,
              point: evalItem.point,
              maxPoint: evalItem.maxPoint,
              catatan: verifyFormData.evaluatorNotes
            }),
          })

          if (!evaluasiResponse.ok) {
            const errorData = await evaluasiResponse.json()
            console.error('Error creating evaluasi:', errorData)
            alert(`Gagal membuat evaluasi untuk ${evalItem.kategori}: ${errorData.error || 'Unknown error'}`)
            return
          }
        }

        setShowVerifyForm(false)
        setSelectedReport(null)
        fetchLaporan()
        alert('Laporan berhasil diverifikasi!')
      } else {
        const errorData = await inspeksiResponse.json()
        console.error('Error creating inspeksi:', errorData)
        alert(`Gagal memverifikasi laporan: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error verifying report:', error)
      alert('Terjadi kesalahan')
    }
  }

  const handleCloseVerifyForm = () => {
    setShowVerifyForm(false)
    setSelectedReport(null)
    setVerifyFormData({
      rating: 5,
      komentar: '',
      evaluatorNotes: '',
      evaluasi: [
        { kategori: 'Kebersihan', point: 0, maxPoint: 25 },
        { kategori: 'Kerapian', point: 0, maxPoint: 25 },
        { kategori: 'Kelayakan', point: 0, maxPoint: 25 },
        { kategori: 'Keamanan', point: 0, maxPoint: 25 }
      ]
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Dashboard Admin</h1>
                <p className="text-sm text-slate-500">Manajemen Kebersihan Kantor</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationSystem role="admin" />
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <LogoutButton 
                user={{
                  namaLengkap: 'Administrator',
                  role: 'Admin',
                  username: 'admin'
                }} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pegawai">Pegawai</TabsTrigger>
            <TabsTrigger value="jadwal">Jadwal</TabsTrigger>
            <TabsTrigger value="ruangan">Ruangan</TabsTrigger>
            <TabsTrigger value="laporan">Laporan</TabsTrigger>
            <TabsTrigger value="kantor">Kantor</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pegawai</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <div className="animate-pulse bg-slate-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.totalPegawai
                    )}
                  </div>
                 <p className="text-xs text-muted-foreground">
                     {isLoadingStats ? (
                     <span className="inline-block animate-pulse bg-slate-200 h-4 w-20 rounded mt-1"></span>
                        ) : (
                          `${stats.pegawaiAktif} aktif`
                     )}
                </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jadwal Hari Ini</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <div className="animate-pulse bg-slate-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.jadwalHariIni
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isLoadingStats ? (
                      <span className="animate-pulse bg-slate-200 h-4 w-24 rounded mt-1"></span>
                    ) : (
                      `${todaySchedule.filter(s => s.status === 'Completed').length} selesai, ${todaySchedule.filter(s => s.status === 'In Progress').length} berjalan`
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Ruangan</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <div className="animate-pulse bg-slate-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.totalRuangan
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isLoadingStats ? (
                      <span className="animate-pulse bg-slate-200 h-4 w-20 rounded mt-1"></span>
                    ) : (
                      'Area terdaftar'
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Laporan Pending</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isLoadingStats ? (
                      <div className="animate-pulse bg-slate-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.laporanPending
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isLoadingStats ? (
                      <span className="animate-pulse bg-slate-200 h-4 w-24 rounded mt-1"></span>
                    ) : (
                      'Menunggu verifikasi'
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Reports & Today Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Laporan Terbaru</CardTitle>
                  <CardDescription>Laporan yang perlu diverifikasi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentReports.length > 0 ? (
                      recentReports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${report.isOld ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                            <div className="flex-1">
                              <p className="font-medium">{report.ruangan}</p>
                              <p className="text-sm text-slate-500">{report.pegawai} • {report.tanggal} {report.waktu}</p>
                              <div className="flex items-center mt-1 space-x-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-24">
                                  <div 
                                    className={`h-2 rounded-full ${report.persentase >= 80 ? 'bg-green-500' : report.persentase >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${report.persentase}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-slate-600">{Math.round(report.persentase)}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={report.status === 'Verified' ? 'default' : 'secondary'}>
                              {report.status}
                            </Badge>
                            {report.isOld && (
                              <p className="text-xs text-orange-600 mt-1">Perlu verifikasi</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Belum ada laporan pending</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Jadwal Hari Ini</CardTitle>
                  <CardDescription>Monitoring jadwal cleaning service</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {todaySchedule.length > 0 ? (
                      todaySchedule.map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="font-medium">{schedule.tugas}</p>
                              <p className="text-sm text-slate-500">{schedule.ruangan} • {schedule.pegawai}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{schedule.jam}</p>
                            <Badge variant={
                              schedule.status === 'Completed' ? 'default' : 
                              schedule.status === 'In Progress' ? 'secondary' : 'outline'
                            }>
                              {schedule.status}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Belum ada jadwal hari ini</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pegawai Tab */}
          <TabsContent value="pegawai" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Manajemen Pegawai</h2>
                <p className="text-slate-500">Kelola data pegawai cleaning service</p>
              </div>
              <Button onClick={() => setShowAddPegawai(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pegawai
              </Button>
            </div>

            {/* Add Pegawai Form */}
            {showAddPegawai && (
              <Card>
                <CardHeader>
                  <CardTitle>Tambah Pegawai Baru</CardTitle>
                  <CardDescription>Isi form berikut untuk menambah pegawai cleaning service</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitPegawai} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nama Lengkap</label>
                        <input
                          type="text"
                          placeholder="Masukkan nama lengkap"
                          value={pegawaiFormData.namaLengkap}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, namaLengkap: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Jenis Kelamin</label>
                        <select
                          value={pegawaiFormData.jenisKelamin}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Pilih jenis kelamin</option>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nomor Telepon</label>
                        <input
                          type="tel"
                          placeholder="Masukkan nomor telepon"
                          value={pegawaiFormData.nomorTelp}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, nomorTelp: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Username</label>
                        <input
                          type="text"
                          placeholder="Masukkan username"
                          value={pegawaiFormData.username}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password</label>
                        <input
                          type="password"
                          placeholder="Masukkan password"
                          value={pegawaiFormData.password}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <select
                          value={pegawaiFormData.role}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="Pegawai">Pegawai</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <select
                          value={pegawaiFormData.status}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Non-Aktif">Non-Aktif</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tanggal Masuk</label>
                        <input
                          type="date"
                          value={pegawaiFormData.tanggalMasuk}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, tanggalMasuk: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Kantor</label>
                        <select
                          value={pegawaiFormData.kantorId}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, kantorId: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Pilih kantor</option>
                          {kantorList.map((kantor) => (
                            <option key={kantor.id} value={kantor.id}>
                              {kantor.nama}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Surat Kontrak (URL)</label>
                        <input
                          type="text"
                          placeholder="Link ke surat kontrak (opsional)"
                          value={pegawaiFormData.suratKontrak}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, suratKontrak: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleClosePegawaiForm}
                      >
                        Batal
                      </Button>
                      <Button type="submit">
                        Simpan Pegawai
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Edit Pegawai Form */}
            {showEditPegawai && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Pegawai</CardTitle>
                  <CardDescription>Perbarui informasi pegawai cleaning service</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdatePegawai} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nama Lengkap</label>
                        <input
                          type="text"
                          placeholder="Masukkan nama lengkap"
                          value={pegawaiFormData.namaLengkap}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, namaLengkap: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Jenis Kelamin</label>
                        <select
                          value={pegawaiFormData.jenisKelamin}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, jenisKelamin: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Pilih jenis kelamin</option>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nomor Telepon</label>
                        <input
                          type="tel"
                          placeholder="Masukkan nomor telepon"
                          value={pegawaiFormData.nomorTelp}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, nomorTelp: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Username</label>
                        <input
                          type="text"
                          placeholder="Masukkan username"
                          value={pegawaiFormData.username}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password <span className="text-xs text-slate-500">(kosongkan jika tidak diubah)</span></label>
                        <input
                          type="password"
                          placeholder="Kosongkan jika tidak diubah"
                          value={pegawaiFormData.password}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <select
                          value={pegawaiFormData.role}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="Pegawai">Pegawai</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <select
                          value={pegawaiFormData.status}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Non-Aktif">Non-Aktif</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tanggal Masuk</label>
                        <input
                          type="date"
                          value={pegawaiFormData.tanggalMasuk}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, tanggalMasuk: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Kantor</label>
                        <select
                          value={pegawaiFormData.kantorId}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, kantorId: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Pilih kantor</option>
                          {kantorList.map((kantor) => (
                            <option key={kantor.id} value={kantor.id}>
                              {kantor.nama}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Surat Kontrak (URL)</label>
                        <input
                          type="text"
                          placeholder="Link ke surat kontrak (opsional)"
                          value={pegawaiFormData.suratKontrak}
                          onChange={(e) => setPegawaiFormData(prev => ({ ...prev, suratKontrak: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleClosePegawaiForm}
                      >
                        Batal
                      </Button>
                      <Button type="submit">
                        Perbarui Pegawai
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Pegawai List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Daftar Pegawai</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari pegawai..." 
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nama</th>
                        <th className="text-left p-2">Username</th>
                        <th className="text-left p-2">Role</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Kantor</th>
                        <th className="text-left p-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pegawaiList.map((pegawai) => (
                        <tr key={pegawai.id} className="border-b">
                          <td className="p-2">{pegawai.namaLengkap}</td>
                          <td className="p-2">{pegawai.username}</td>
                          <td className="p-2">
                            <Badge variant={pegawai.role === 'Admin' ? 'default' : 'secondary'}>
                              {pegawai.role}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge variant={pegawai.status === 'Aktif' ? 'default' : 'destructive'}>
                              {pegawai.status}
                            </Badge>
                          </td>
                          <td className="p-2">{pegawai.kantor?.nama || '-'}</td>
                          <td className="p-2">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditPegawai(pegawai)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeletePegawai(pegawai.id)}
                              >
                                Hapus
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jadwal Tab - AKTIF */}
          <TabsContent value="jadwal" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Manajemen Jadwal</h2>
                <p className="text-slate-500">Kelola jadwal cleaning service</p>
              </div>
              <Button onClick={() => setShowAddJadwal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Jadwal Baru
              </Button>
            </div>

            {/* Add Jadwal Form */}
            {showAddJadwal && (
              <Card>
                <CardHeader>
                  <CardTitle>Tambah Jadwal Baru</CardTitle>
                  <CardDescription>Isi form berikut untuk menambah jadwal cleaning service</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitJadwal} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nama Tugas</label>
                        <input
                          type="text"
                          placeholder="Contoh: Cleaning Ruang Meeting"
                          value={formData.namaTugas}
                          onChange={(e) => setFormData(prev => ({ ...prev, namaTugas: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Ruangan/Area</label>
                        <select
                          value={formData.ruanganId}
                          onChange={(e) => setFormData(prev => ({ ...prev, ruanganId: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Pilih Ruangan</option>
                          {ruanganList.map((ruangan) => (
                            <option key={ruangan.id} value={ruangan.id}>
                              {ruangan.nama} ({ruangan.tipeArea})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Hari/Tanggal</label>
                        <input
                          type="date"
                          value={formData.hariTanggal}
                          onChange={(e) => setFormData(prev => ({ ...prev, hariTanggal: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Pegawai yang Ditugaskan</label>
                        <select
                          value={formData.pegawaiId}
                          onChange={(e) => setFormData(prev => ({ ...prev, pegawaiId: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Pilih Pegawai</option>
                          {pegawaiList.map((pegawai) => (
                            <option key={pegawai.id} value={pegawai.id}>
                              {pegawai.namaLengkap} (@{pegawai.username})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Jam Mulai</label>
                        <input
                          type="time"
                          value={formData.jamMulai}
                          onChange={(e) => setFormData(prev => ({ ...prev, jamMulai: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Jam Selesai</label>
                        <input
                          type="time"
                          value={formData.jamSelesai}
                          onChange={(e) => setFormData(prev => ({ ...prev, jamSelesai: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowAddJadwal(false)}
                      >
                        Batal
                      </Button>
                      <Button type="submit">
                        Simpan Jadwal
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Edit Jadwal Form */}
            {showEditJadwal && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Jadwal</CardTitle>
                  <CardDescription>Perbarui informasi jadwal cleaning service</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateJadwal} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nama Tugas</label>
                        <input
                          type="text"
                          placeholder="Contoh: Cleaning Ruang Meeting"
                          value={formData.namaTugas}
                          onChange={(e) => setFormData(prev => ({ ...prev, namaTugas: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Ruangan/Area</label>
                        <select
                          value={formData.ruanganId}
                          onChange={(e) => setFormData(prev => ({ ...prev, ruanganId: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Pilih Ruangan</option>
                          {ruanganList.map((ruangan) => (
                            <option key={ruangan.id} value={ruangan.id}>
                              {ruangan.nama} ({ruangan.tipeArea})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Hari/Tanggal</label>
                        <input
                          type="date"
                          value={formData.hariTanggal}
                          onChange={(e) => setFormData(prev => ({ ...prev, hariTanggal: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Pegawai yang Ditugaskan</label>
                        <select
                          value={formData.pegawaiId}
                          onChange={(e) => setFormData(prev => ({ ...prev, pegawaiId: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Pilih Pegawai</option>
                          {pegawaiList.map((pegawai) => (
                            <option key={pegawai.id} value={pegawai.id}>
                              {pegawai.namaLengkap} (@{pegawai.username})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Jam Mulai</label>
                        <input
                          type="time"
                          value={formData.jamMulai}
                          onChange={(e) => setFormData(prev => ({ ...prev, jamMulai: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Jam Selesai</label>
                        <input
                          type="time"
                          value={formData.jamSelesai}
                          onChange={(e) => setFormData(prev => ({ ...prev, jamSelesai: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCloseForm}
                      >
                        Batal
                      </Button>
                      <Button type="submit">
                        Perbarui Jadwal
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Jadwal List */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Jadwal</CardTitle>
                <CardDescription>Semua jadwal cleaning service yang telah dibuat</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jadwalList.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>Belum ada jadwal</p>
                      <p className="text-sm">Klik "Tambah Jadwal Baru" untuk membuat jadwal pertama</p>
                    </div>
                  ) : (
                    jadwalList.map((jadwal) => (
                      <div key={jadwal.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Calendar className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium">{jadwal.namaTugas}</p>
                            <p className="text-sm text-slate-500">
                              {jadwal.ruangan.nama} • {jadwal.pegawai.namaLengkap}
                            </p>
                            <p className="text-xs text-slate-400">
                              {jadwal.hariTanggal} • {jadwal.jamMulai} - {jadwal.jamSelesai}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            jadwal.status === 'Completed' ? 'default' : 
                            jadwal.status === 'In Progress' ? 'secondary' : 'outline'
                          }>
                            {jadwal.status}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => handleEditJadwal(jadwal)}>Edit</Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteJadwal(jadwal.id)}>Hapus</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ruangan Tab */}
          <TabsContent value="ruangan" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Manajemen Ruangan</h2>
                <p className="text-slate-500">Kelola data ruangan dan area kantor</p>
              </div>
              <Button onClick={() => setShowAddRuangan(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Ruangan
              </Button>
            </div>

            {/* Add Ruangan Form */}
            {showAddRuangan && (
              <Card>
                <CardHeader>
                  <CardTitle>Tambah Ruangan Baru</CardTitle>
                  <CardDescription>Isi form berikut untuk menambah ruangan/area baru</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitRuangan} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nama Ruangan/Area</label>
                        <input
                          type="text"
                          placeholder="Contoh: Ruang Meeting A"
                          value={ruanganFormData.nama}
                          onChange={(e) => setRuanganFormData(prev => ({ ...prev, nama: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipe Area</label>
                        <select
                          value={ruanganFormData.tipeArea}
                          onChange={(e) => setRuanganFormData(prev => ({ ...prev, tipeArea: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Pilih tipe area</option>
                          <option value="Meeting Room">Meeting Room</option>
                          <option value="Office">Office</option>
                          <option value="Corridor">Corridor</option>
                          <option value="Pantry">Pantry</option>
                          <option value="Toilet">Toilet</option>
                          <option value="Storage">Storage</option>
                          <option value="Lobby">Lobby</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tingkat Lantai</label>
                        <input
                          type="number"
                          placeholder="Contoh: 1"
                          value={ruanganFormData.tingkatLantai}
                          onChange={(e) => setRuanganFormData(prev => ({ ...prev, tingkatLantai: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          min="1"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <select
                          value={ruanganFormData.status}
                          onChange={(e) => setRuanganFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Perbaikan">Perbaikan</option>
                          <option value="Non-Aktif">Non-Aktif</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Kantor</label>
                        <select
                          value={ruanganFormData.kantorId}
                          onChange={(e) => setRuanganFormData(prev => ({ ...prev, kantorId: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Pilih kantor</option>
                          {kantorList.map((kantor) => (
                            <option key={kantor.id} value={kantor.id}>
                              {kantor.nama}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Deskripsi</label>
                      <textarea
                        placeholder="Deskripsikan ruangan/area ini..."
                        value={ruanganFormData.deskripsi}
                        onChange={(e) => setRuanganFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Custom Checklist untuk Pegawai</label>
                      <textarea
                        placeholder="Contoh: Sapu lantai secara menyeluruh, Pel lantai dengan desinfektan, Lap semua meja dan kursi, Bersihkan jendela dan kaca, Buang sampah di semua tempat sampah, Organisir ulang peralatan"
                        value={ruanganFormData.customChecklist}
                        onChange={(e) => setRuanganFormData(prev => ({ ...prev, customChecklist: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={4}
                      />
                      <p className="text-xs text-slate-500">
                        <strong>Format:</strong> Pisahkan setiap item checklist dengan koma.<br/>
                        <strong>Contoh:</strong> Sapu lantai, Lap meja, Bersihkan jendela<br/>
                        <strong>Kosongkan:</strong> Jika tidak diisi, akan menggunakan checklist default sesuai tipe ruangan
                      </p>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCloseRuanganForm}
                      >
                        Batal
                      </Button>
                      <Button type="submit">
                        Simpan Ruangan
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Edit Ruangan Form */}
            {showEditRuangan && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Ruangan</CardTitle>
                  <CardDescription>Perbarui informasi ruangan/area</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateRuangan} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nama Ruangan/Area</label>
                        <input
                          type="text"
                          placeholder="Contoh: Ruang Meeting A"
                          value={ruanganFormData.nama}
                          onChange={(e) => setRuanganFormData(prev => ({ ...prev, nama: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tipe Area</label>
                        <select
                          value={ruanganFormData.tipeArea}
                          onChange={(e) => setRuanganFormData(prev => ({ ...prev, tipeArea: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Pilih tipe area</option>
                          <option value="Meeting Room">Meeting Room</option>
                          <option value="Office">Office</option>
                          <option value="Corridor">Corridor</option>
                          <option value="Pantry">Pantry</option>
                          <option value="Toilet">Toilet</option>
                          <option value="Storage">Storage</option>
                          <option value="Lobby">Lobby</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tingkat Lantai</label>
                        <input
                          type="number"
                          placeholder="Contoh: 1"
                          value={ruanganFormData.tingkatLantai}
                          onChange={(e) => setRuanganFormData(prev => ({ ...prev, tingkatLantai: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          min="1"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <select
                          value={ruanganFormData.status}
                          onChange={(e) => setRuanganFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Perbaikan">Perbaikan</option>
                          <option value="Non-Aktif">Non-Aktif</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Kantor</label>
                        <select
                          value={ruanganFormData.kantorId}
                          onChange={(e) => setRuanganFormData(prev => ({ ...prev, kantorId: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                          required
                        >
                          <option value="">Pilih kantor</option>
                          {kantorList.map((kantor) => (
                            <option key={kantor.id} value={kantor.id}>
                              {kantor.nama}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Deskripsi</label>
                      <textarea
                        placeholder="Deskripsikan ruangan/area ini..."
                        value={ruanganFormData.deskripsi}
                        onChange={(e) => setRuanganFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Custom Checklist untuk Pegawai</label>
                      <textarea
                        placeholder="Contoh: Sapu lantai secara menyeluruh, Pel lantai dengan desinfektan, Lap semua meja dan kursi, Bersihkan jendela dan kaca, Buang sampah di semua tempat sampah, Organisir ulang peralatan"
                        value={ruanganFormData.customChecklist}
                        onChange={(e) => setRuanganFormData(prev => ({ ...prev, customChecklist: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={4}
                      />
                      <p className="text-xs text-slate-500">
                        <strong>Format:</strong> Pisahkan setiap item checklist dengan koma.<br/>
                        <strong>Contoh:</strong> Sapu lantai, Lap meja, Bersihkan jendela<br/>
                        <strong>Kosongkan:</strong> Jika tidak diisi, akan menggunakan checklist default sesuai tipe ruangan
                      </p>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCloseRuanganForm}
                      >
                        Batal
                      </Button>
                      <Button type="submit">
                        Update Ruangan
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Ruangan List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Daftar Ruangan</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari ruangan..." 
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nama Ruangan</th>
                        <th className="text-left p-2">Tipe Area</th>
                        <th className="text-left p-2">Lantai</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Checklist</th>
                        <th className="text-left p-2">Kantor</th>
                        <th className="text-left p-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ruanganList.map((ruangan) => (
                        <tr key={ruangan.id} className="border-b">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{ruangan.nama}</p>
                              {ruangan.deskripsi && (
                                <p className="text-xs text-slate-500">{ruangan.deskripsi}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-2">{ruangan.tipeArea}</td>
                          <td className="p-2">{ruangan.tingkatLantai}</td>
                          <td className="p-2">
                            <Badge variant={
                              ruangan.status === 'Aktif' ? 'default' : 
                              ruangan.status === 'Perbaikan' ? 'secondary' : 'destructive'
                            }>
                              {ruangan.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="max-w-xs">
                              {ruangan.customChecklist ? (
                                <div className="text-xs">
                                  <p className="font-medium text-green-600">Custom:</p>
                                  <p className="text-slate-600 truncate">
                                    {ruangan.customChecklist}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500">Default (sesuai tipe)</p>
                              )}
                            </div>
                          </td>
                          <td className="p-2">{ruangan.kantor?.nama || '-'}</td>
                          <td className="p-2">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditRuangan(ruangan)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteRuangan(ruangan.id)}
                              >
                                Hapus
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="laporan" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Manajemen Laporan</h2>
                <p className="text-slate-500">Verifikasi dan evaluasi laporan inspeksi</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/api/laporan/export?' + new URLSearchParams({
                    periode: filterPeriode,
                    pegawaiId: filterPegawai,
                    kantorId: 'cmhbck9ti002ioiho6va6srf4'
                  }), '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>

            {/* Filter Section */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Laporan</CardTitle>
                <CardDescription>Sortir laporan berdasarkan kriteria tertentu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sortir Periodik</label>
                    <select 
                      value={filterPeriode}
                      onChange={(e) => setFilterPeriode(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Semua Periode</option>
                      <option value="hari-ini">Hari Ini</option>
                      <option value="minggu-ini">Minggu Ini</option>
                      <option value="bulan-ini">Bulan Ini</option>
                      <option value="tahun-ini">Tahun Ini</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sortir per Pegawai</label>
                    <select 
                      value={filterPegawai}
                      onChange={(e) => setFilterPegawai(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Keseluruhan Pegawai</option>
                      {pegawaiList.map(pegawai => (
                        <option key={pegawai.id} value={pegawai.id}>
                          {pegawai.namaLengkap}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status Laporan</label>
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Semua Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Verified">Verified</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Laporan</p>
                      <p className="text-2xl font-bold">{laporanStats.total}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Pending</p>
                      <p className="text-2xl font-bold text-orange-500">{laporanStats.pending}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Verified</p>
                      <p className="text-2xl font-bold text-green-500">{laporanStats.verified}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Rating Rata-rata</p>
                      <p className="text-2xl font-bold">{laporanStats.avgRating.toFixed(1)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Reports Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Daftar Laporan</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari laporan..." 
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Tanggal</th>
                        <th className="text-left p-2">Pegawai</th>
                        <th className="text-left p-2">Ruangan</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Persentase</th>
                        <th className="text-left p-2">Masalah</th>
                        <th className="text-left p-2">Rating</th>
                        <th className="text-left p-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {console.log('Rendering laporanList:', laporanList)}
                      {laporanList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center p-4 text-slate-500">
                            Tidak ada data laporan
                          </td>
                        </tr>
                      ) : (
                        laporanList.map((laporan) => (
                          <tr key={laporan.id} className="border-b">
                            <td className="p-2">
                              <div>
                                <p className="text-sm">{new Date(laporan.createdAt).toLocaleDateString('id-ID')}</p>
                                <p className="text-xs text-slate-500">{new Date(laporan.createdAt).toLocaleTimeString('id-ID')}</p>
                              </div>
                            </td>
                            <td className="p-2">
                              <p className="font-medium">{laporan.jadwal.pegawai.namaLengkap}</p>
                            </td>
                            <td className="p-2">
                              <p className="font-medium">{laporan.jadwal.ruangan.nama}</p>
                            </td>
                            <td className="p-2">
                              <Badge variant={
                                laporan.status === 'Verified' ? 'default' : 
                                laporan.status === 'Pending' ? 'secondary' : 'destructive'
                              }>
                                {laporan.status}
                              </Badge>
                            </td>
                            <td className="p-2">
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-slate-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${laporan.persentase}%` }}
                                  />
                                </div>
                                <span className="text-sm">{laporan.persentase.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="p-2">
                              {laporan.checklist && (() => {
                                const checklist = JSON.parse(laporan.checklist);
                                const itemsWithIssues = checklist.filter((item: any) => item.hasIssue || item.hasProblem);
                                
                                if (itemsWithIssues.length > 0) {
                                  return (
                                    <div className="flex items-center space-x-1">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        ⚠️ {itemsWithIssues.length}
                                      </span>
                                    </div>
                                  );
                                }
                                
                                return (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ✅
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="p-2">
                              {laporan.inspeksi.length > 0 ? (
                                <div className="flex items-center space-x-1">
                                  <span className="text-sm font-medium">
                                    {(laporan.inspeksi.reduce((sum, i) => sum + i.rating, 0) / laporan.inspeksi.length).toFixed(1)}
                                  </span>
                                  <span className="text-yellow-500">⭐</span>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-2">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleViewReport(laporan)}
                                >
                                  Detail
                                </Button>
                                {laporan.status === 'Pending' && (
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={() => handleVerifyReport(laporan)}
                                  >
                                    Verifikasi
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kantor">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Manajemen Kantor</h2>
                <p className="text-slate-500">Kelola data kantor dan instansi</p>
              </div>
              <Button onClick={() => setShowAddKantor(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kantor
              </Button>
            </div>

            {/* Add Kantor Form */}
            {showAddKantor && (
              <Card>
                <CardHeader>
                  <CardTitle>Tambah Kantor Baru</CardTitle>
                  <CardDescription>Isi form berikut untuk menambah kantor/instansi baru</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitKantor} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nama Kantor/Instansi</label>
                      <input
                        type="text"
                        placeholder="Contoh: Kantor Pusat Jakarta"
                        value={kantorFormData.nama}
                        onChange={(e) => setKantorFormData(prev => ({ ...prev, nama: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Alamat</label>
                      <textarea
                        placeholder="Masukkan alamat lengkap kantor"
                        value={kantorFormData.alamat}
                        onChange={(e) => setKantorFormData(prev => ({ ...prev, alamat: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lokasi MAP (Koordinat GPS)</label>
                      <input
                        type="text"
                        placeholder="Contoh: -6.2088, 106.8456"
                        value={kantorFormData.lokasiMap}
                        onChange={(e) => setKantorFormData(prev => ({ ...prev, lokasiMap: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                      <p className="text-xs text-slate-500">Format: latitude, longitude (opsional)</p>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border rounded-lg bg-slate-50">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="trackingGeo"
                          checked={kantorFormData.trackingGeo}
                          onChange={(e) => setKantorFormData(prev => ({ ...prev, trackingGeo: e.target.checked }))}
                          className="h-4 w-4 text-primary rounded"
                        />
                        <label htmlFor="trackingGeo" className="text-sm font-medium">
                          Tracking Pegawai: Geofencing
                        </label>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">
                          {kantorFormData.trackingGeo 
                            ? "✅ Tracking geofencing AKTIF - Pegawai akan dilacak lokasinya"
                            : "❌ Tracking geofencing NON-AKTIF - Tidak ada pelacakan lokasi"
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCloseKantorForm}
                      >
                        Batal
                      </Button>
                      <Button type="submit">
                        Simpan Kantor
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Edit Kantor Form */}
            {showEditKantor && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Kantor</CardTitle>
                  <CardDescription>Perbarui informasi kantor/instansi</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateKantor} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nama Kantor/Instansi</label>
                      <input
                        type="text"
                        placeholder="Contoh: Kantor Pusat Jakarta"
                        value={kantorFormData.nama}
                        onChange={(e) => setKantorFormData(prev => ({ ...prev, nama: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Alamat</label>
                      <textarea
                        placeholder="Masukkan alamat lengkap kantor"
                        value={kantorFormData.alamat}
                        onChange={(e) => setKantorFormData(prev => ({ ...prev, alamat: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lokasi MAP (Koordinat GPS)</label>
                      <input
                        type="text"
                        placeholder="Contoh: -6.2088, 106.8456"
                        value={kantorFormData.lokasiMap}
                        onChange={(e) => setKantorFormData(prev => ({ ...prev, lokasiMap: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                      <p className="text-xs text-slate-500">Format: latitude, longitude (opsional)</p>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border rounded-lg bg-slate-50">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="trackingGeoEdit"
                          checked={kantorFormData.trackingGeo}
                          onChange={(e) => setKantorFormData(prev => ({ ...prev, trackingGeo: e.target.checked }))}
                          className="h-4 w-4 text-primary rounded"
                        />
                        <label htmlFor="trackingGeoEdit" className="text-sm font-medium">
                          Tracking Pegawai: Geofencing
                        </label>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500">
                          {kantorFormData.trackingGeo 
                            ? "✅ Tracking geofencing AKTIF - Pegawai akan dilacak lokasinya"
                            : "❌ Tracking geofencing NON-AKTIF - Tidak ada pelacakan lokasi"
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCloseKantorForm}
                      >
                        Batal
                      </Button>
                      <Button type="submit">
                        Update Kantor
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Kantor List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Daftar Kantor</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari kantor..." 
                      className="px-3 py-2 border rounded-md text-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nama Kantor</th>
                        <th className="text-left p-2">Alamat</th>
                        <th className="text-left p-2">Lokasi MAP</th>
                        <th className="text-left p-2">Tracking</th>
                        <th className="text-left p-2">Jumlah Pegawai</th>
                        <th className="text-left p-2">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kantorList.map((kantor) => (
                        <tr key={kantor.id} className="border-b">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{kantor.nama}</p>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="max-w-xs">
                              <p className="text-sm truncate">{kantor.alamat}</p>
                            </div>
                          </td>
                          <td className="p-2">
                            {kantor.lokasiMap ? (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4 text-green-500" />
                                <span className="text-xs">{kantor.lokasiMap}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-2">
                            <Badge variant={kantor.trackingGeo ? 'default' : 'secondary'}>
                              {kantor.trackingGeo ? 'ON' : 'OFF'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4 text-slate-400" />
                              <span className="text-sm">{kantor.pegawai?.length || 0}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditKantor(kantor)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteKantor(kantor.id)}
                              >
                                Hapus
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Verification Form Modal */}
      {showVerifyForm && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <CardTitle>Verifikasi Laporan Inspeksi</CardTitle>
              <CardDescription>
                Berikan rating, komentar, dan evaluasi untuk laporan {selectedReport.jadwal.pegawai.namaLengkap} - {selectedReport.jadwal.ruangan.nama}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitVerification} className="space-y-6">
                {/* Report Info */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Informasi Laporan</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Pegawai:</span> {selectedReport.jadwal.pegawai.namaLengkap}
                    </div>
                    <div>
                      <span className="font-medium">Ruangan:</span> {selectedReport.jadwal.ruangan.nama}
                    </div>
                    <div>
                      <span className="font-medium">Tanggal:</span> {new Date(selectedReport.createdAt).toLocaleDateString('id-ID')}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> 
                      <Badge variant="secondary" className="ml-2">{selectedReport.status}</Badge>
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rating Keseluruhan (1-5)</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setVerifyFormData(prev => ({ ...prev, rating: star }))}
                        className="text-2xl transition-colors"
                      >
                        <span className={star <= verifyFormData.rating ? 'text-yellow-500' : 'text-gray-300'}>
                          ⭐
                        </span>
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-medium">{verifyFormData.rating}/5</span>
                  </div>
                </div>

                {/* Evaluation Categories */}
                <div className="space-y-4">
                  <label className="text-sm font-medium">Evaluasi per Kategori</label>
                  {verifyFormData.evaluasi.map((evalItem, index) => (
                    <div key={evalItem.kategori} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{evalItem.kategori}</h4>
                        <span className="text-sm text-slate-500">Max: {evalItem.maxPoint} poin</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="0"
                          max={evalItem.maxPoint}
                          value={evalItem.point}
                          onChange={(e) => {
                            const newEvaluasi = [...verifyFormData.evaluasi]
                            newEvaluasi[index].point = parseInt(e.target.value)
                            setVerifyFormData(prev => ({ ...prev, evaluasi: newEvaluasi }))
                          }}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-12 text-right">{evalItem.point}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comments */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Komentar Verifikasi</label>
                  <textarea
                    placeholder="Berikan komentar atau catatan untuk verifikasi ini..."
                    value={verifyFormData.komentar}
                    onChange={(e) => setVerifyFormData(prev => ({ ...prev, komentar: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>

                {/* Evaluator Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catatan Evaluasi (Internal)</label>
                  <textarea
                    placeholder="Catatan internal untuk evaluasi..."
                    value={verifyFormData.evaluatorNotes}
                    onChange={(e) => setVerifyFormData(prev => ({ ...prev, evaluatorNotes: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={2}
                  />
                </div>

                {/* Point Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Ringkasan Poin</h4>
                  <div className="space-y-1 text-sm">
                    {verifyFormData.evaluasi.map((evalItem) => (
                      <div key={evalItem.kategori} className="flex justify-between">
                        <span>{evalItem.kategori}:</span>
                        <span className="font-medium">{evalItem.point}/{evalItem.maxPoint}</span>
                      </div>
                    ))}
                    <div className="border-t pt-1 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>
                          {verifyFormData.evaluasi.reduce((sum, item) => sum + item.point, 0)}/
                          {verifyFormData.evaluasi.reduce((sum, item) => sum + item.maxPoint, 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseVerifyForm}
                  >
                    Batal
                  </Button>
                  <Button type="submit">
                    Verifikasi Laporan
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Detail Dialog */}
      {showReportDetail && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Detail Laporan Inspeksi</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowReportDetail(false)}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Informasi Umum */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-slate-600">Informasi Laporan</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">ID Laporan:</span>
                      <span className="font-medium">{selectedReport.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tanggal:</span>
                      <span className="font-medium">
                        {new Date(selectedReport.createdAt).toLocaleDateString('id-ID')} {' '}
                        {new Date(selectedReport.createdAt).toLocaleTimeString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <Badge variant={
                        selectedReport.status === 'Verified' ? 'default' : 
                        selectedReport.status === 'Pending' ? 'secondary' : 'destructive'
                      }>
                        {selectedReport.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-slate-600">Informasi Tugas</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Tugas:</span>
                      <span className="font-medium">{selectedReport.jadwal?.namaTugas || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Petugas:</span>
                      <span className="font-medium">{selectedReport.jadwal?.pegawai?.namaLengkap || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Ruangan:</span>
                      <span className="font-medium">{selectedReport.jadwal?.ruangan?.nama || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-slate-600">Checklist Pekerjaan</h4>
                
                {/* Ringkasan Masalah */}
                {selectedReport.checklist && (() => {
                  const checklist = JSON.parse(selectedReport.checklist);
                  const itemsWithIssues = checklist.filter((item: any) => item.hasIssue || item.hasProblem);
                  const totalItems = checklist.length;
                  const completedItems = checklist.filter((item: any) => item.checked || item.completed).length;
                  
                  if (itemsWithIssues.length > 0) {
                    return (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-amber-800 font-medium text-sm">⚠️ Ada {itemsWithIssues.length} item dengan masalah</span>
                          <span className="text-amber-600 text-xs">
                            ({completedItems}/{totalItems} selesai)
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-amber-700">
                          Items: {itemsWithIssues.map((item: any) => item.item || item.text).join(', ')}
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-green-800 font-medium text-sm">✅ Tidak ada masalah</span>
                        <span className="text-green-600 text-xs">
                          ({completedItems}/{totalItems} selesai)
                        </span>
                      </div>
                    </div>
                  );
                })()}
                
                <div className="border rounded-lg p-4">
                  {selectedReport.checklist ? (
                    <div className="space-y-2">
                      {JSON.parse(selectedReport.checklist).map((item: any, index: number) => {
                        // Handle both old and new checklist formats
                        const isChecked = item.checked || item.completed || false;
                        const hasIssue = item.hasIssue || item.hasProblem || false;
                        const text = item.text || item.item || 'Item tidak diketahui';
                        const point = item.point || 1;
                        
                        return (
                          <div key={index} className={`p-2 border-b last:border-b-0 ${hasIssue ? 'bg-red-50 border-red-200' : ''}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  className="rounded"
                                />
                                <span className={isChecked ? 'text-slate-900' : 'text-slate-500 line-through'}>
                                  {text}
                                </span>
                                {hasIssue && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    ⚠️ Ada Masalah
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-slate-500">
                                {point} poin
                              </span>
                            </div>
                            {hasIssue && item.problemDescription && (
                              <div className="mt-2 p-2 bg-red-100 rounded text-sm">
                                <p className="text-red-800">
                                  <strong>Deskripsi Masalah:</strong> {item.problemDescription}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">Tidak ada checklist</p>
                  )}
                </div>
              </div>

              {/* Hasil */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedReport.totalPoint || 0}</div>
                  <div className="text-sm text-slate-600">Total Poin</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedReport.persentase?.toFixed(1) || 0}%</div>
                  <div className="text-sm text-slate-600">Persentase</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {selectedReport.inspeksi?.length > 0 
                      ? (selectedReport.inspeksi.reduce((sum: number, i: any) => sum + i.rating, 0) / selectedReport.inspeksi.length).toFixed(1)
                      : '-'
                    }
                  </div>
                  <div className="text-sm text-slate-600">Rating Rata-rata</div>
                </div>
              </div>

              {/* Komentar */}
              {selectedReport.komentar && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-slate-600">Komentar Petugas</h4>
                  <div className="border rounded-lg p-4 bg-slate-50">
                    <p className="text-sm">{selectedReport.komentar}</p>
                  </div>
                </div>
              )}

              {/* Foto Masalah */}
              {selectedReport.fotoMasalah && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-slate-600">Dokumentasi</h4>
                  <div className="border rounded-lg p-4">
                    <img 
                      src={selectedReport.fotoMasalah} 
                      alt="Dokumentasi" 
                      className="max-w-full h-auto rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EGambar tidak tersedia%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Inspeksi yang Sudah Dilakukan */}
              {selectedReport.inspeksi && selectedReport.inspeksi.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-slate-600">Inspeksi yang Telah Dilakukan</h4>
                  <div className="space-y-3">
                    {selectedReport.inspeksi.map((inspeksi: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{inspeksi.inspector?.namaLengkap || 'Inspector'}</p>
                            <p className="text-sm text-slate-500">
                              {new Date(inspeksi.createdAt).toLocaleDateString('id-ID')} {' '}
                              {new Date(inspeksi.createdAt).toLocaleTimeString('id-ID')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-sm font-medium">{inspeksi.rating}</span>
                            <span className="text-yellow-500">⭐</span>
                          </div>
                        </div>
                        {inspeksi.catatan && (
                          <p className="text-sm text-slate-600 mt-2">{inspeksi.catatan}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluasi */}
              {selectedReport.evaluasi && selectedReport.evaluasi.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-slate-600">Hasil Evaluasi</h4>
                  <div className="space-y-3">
                    {selectedReport.evaluasi.map((evaluasi: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 bg-green-50">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium">{evaluasi.kategori}</h5>
                          <span className="text-sm font-medium">{evaluasi.point}/{evaluasi.maxPoint}</span>
                        </div>
                        {evaluasi.catatan && (
                          <p className="text-sm text-slate-600 mt-2">{evaluasi.catatan}</p>
                        )}
                      </div>
                    ))}
                    <div className="border rounded-lg p-4 bg-green-100">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Total Poin:</span>
                          <span className="ml-2 font-medium">
                            {selectedReport.evaluasi.reduce((sum: number, e: any) => sum + e.point, 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Max Poin:</span>
                          <span className="ml-2 font-medium">
                            {selectedReport.evaluasi.reduce((sum: number, e: any) => sum + e.maxPoint, 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Persentase:</span>
                          <span className="ml-2 font-medium">
                            {(
                              (selectedReport.evaluasi.reduce((sum: number, e: any) => sum + e.point, 0) / 
                               selectedReport.evaluasi.reduce((sum: number, e: any) => sum + e.maxPoint, 0)) * 100
                            ).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Tanggal Evaluasi:</span>
                          <span className="ml-2 font-medium">
                            {new Date(selectedReport.evaluasi[0].createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-6 border-t mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowReportDetail(false)}
              >
                Tutup
              </Button>
              {selectedReport.status === 'Pending' && (
                <Button 
                  onClick={() => {
                    setShowReportDetail(false)
                    handleVerifyReport(selectedReport)
                  }}
                >
                  Verifikasi Laporan
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}