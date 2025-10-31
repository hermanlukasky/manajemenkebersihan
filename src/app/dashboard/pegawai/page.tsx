'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { NotificationSystem } from '@/components/ui/notification'
import { LogoutButton } from '@/components/ui/logout-button'
import { API_CONFIG } from '@/lib/api-config'
import {
  User, Calendar, Clock, CheckCircle, MapPin, Camera, FileText,
  Play, AlertCircle, TrendingUp, Star, Upload, X
} from 'lucide-react'

interface ProfileData {
  id: string
  namaLengkap: string
  username: string
  role: string
  status: string
  jenisKelamin: string
  nomorTelp: string
  tanggalMasuk: string
  suratKontrak: string
  kantorId?: string
  kantor?: {
    id: string
    nama: string
  }
}

interface Jadwal {
  id: string
  namaTugas: string
  ruangan: {
    id: string
    nama: string
    tipeArea: string
  }
  hariTanggal: string
  jamMulai: string
  jamSelesai: string
  status: string
}

interface Laporan {
  id: string
  jadwal: Jadwal
  checklist: string
  fotoMasalah?: string
  komentar?: string
  status: string
  totalPoint: number
  persentase: number
  createdAt: string
  inspeksi: Array<{
    rating: number
    komentar?: string
    inspector: {
      namaLengkap: string
    }
  }>
}

export default function PegawaiDashboard() {
  const [activeTab, setActiveTab] = useState('jadwal')
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [todaySchedule, setTodaySchedule] = useState<Jadwal[]>([])
  const [upcomingSchedule, setUpcomingSchedule] = useState<Jadwal[]>([])
  const [laporanList, setLaporanList] = useState<Laporan[]>([])
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null)
  const [showChecklist, setShowChecklist] = useState(false)
  const [checklistData, setChecklistData] = useState<any[]>([])
  const [checklistComments, setChecklistComments] = useState('')
  const [checklistPhoto, setChecklistPhoto] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Fetch data on component mount
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchProfile(),
        fetchTodaySchedule(),
        fetchUpcomingSchedule(),
        fetchLaporan()
      ])
      setIsLoading(false)
    }
    
    loadAllData()
  }, [])

  // Listen for localStorage changes (for real-time updates)
  useEffect(() => {
    const handleStorageChange = () => {
      fetchProfile()
      fetchTodaySchedule()
      fetchUpcomingSchedule()
      fetchLaporan()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProfile()
        fetchTodaySchedule()
        fetchUpcomingSchedule()
        fetchLaporan()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      // Get current user from localStorage or session
      const username = localStorage.getItem('username')
      if (!username) {
        console.error('No username found in localStorage')
        return
      }
      
      const response = await API_CONFIG.apiRequest(`/api/pegawai?username=${username}`)
      const data = await response.json()
      
      if (data.length > 0) {
        setProfileData(data[0])
      } else {
        console.error('No profile data found for username:', username)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchTodaySchedule = async () => {
    try {
      const username = localStorage.getItem('username')
      if (!username) {
        console.error('No username found in localStorage')
        return
      }
      
      const today = new Date().toISOString().split('T')[0]
      const response = await API_CONFIG.apiRequest(`/api/jadwal?pegawai=${username}&tanggal=${today}`)
      const data = await response.json()
      
      // Additional sorting by time (jamMulai) to ensure correct order
      const sortedData = data.sort((a: Jadwal, b: Jadwal) => {
        const [hourA, minuteA] = a.jamMulai.split(':').map(Number)
        const [hourB, minuteB] = b.jamMulai.split(':').map(Number)
        const totalMinutesA = hourA * 60 + minuteA
        const totalMinutesB = hourB * 60 + minuteB
        return totalMinutesA - totalMinutesB
      })
      
      setTodaySchedule(sortedData)
    } catch (error) {
      console.error('Error fetching today schedule:', error)
    }
  }

  const fetchUpcomingSchedule = async () => {
    try {
      const username = localStorage.getItem('username')
      if (!username) {
        console.error('No username found in localStorage')
        return
      }
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      const response = await API_CONFIG.apiRequest(`/api/jadwal?pegawai=${username}&startDate=${tomorrow.toISOString().split('T')[0]}&endDate=${nextWeek.toISOString().split('T')[0]}`)
      const data = await response.json()
      
      // Sort by date and time to show the closest upcoming task first
      const sortedData = data.sort((a: Jadwal, b: Jadwal) => {
        const dateA = new Date(a.hariTanggal)
        const dateB = new Date(b.hariTanggal)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime()
        }
        // If same date, sort by time in 24-hour format
        const [hourA, minuteA] = a.jamMulai.split(':').map(Number)
        const [hourB, minuteB] = b.jamMulai.split(':').map(Number)
        const totalMinutesA = hourA * 60 + minuteA
        const totalMinutesB = hourB * 60 + minuteB
        return totalMinutesA - totalMinutesB
      })
      
      setUpcomingSchedule(sortedData)
    } catch (error) {
      console.error('Error fetching upcoming schedule:', error)
    }
  }

  const fetchLaporan = async () => {
    try {
      const username = localStorage.getItem('username')
      if (!username) {
        console.error('No username found in localStorage')
        return
      }
      
      const response = await API_CONFIG.apiRequest(`/api/laporan?pegawai=${username}`)
      const data = await response.json()
      setLaporanList(data.data || [])
    } catch (error) {
      console.error('Error fetching laporan:', error)
    }
  }

  const handleStartTask = async (jadwal: Jadwal) => {
    setSelectedJadwal(jadwal)
    
    try {
      // Fetch room data to get custom checklist from admin
      const response = await API_CONFIG.apiRequest(`/api/ruangan/${jadwal.ruangan.id}`)
      if (response.ok) {
        const ruangan = await response.json()
        
        let roomChecklist: string[]
        
        // Use custom checklist if available, otherwise use default
        if (ruangan.customChecklist && ruangan.customChecklist.trim()) {
          roomChecklist = ruangan.customChecklist.split(',').map(item => item.trim()).filter(item => item)
        } else {
          roomChecklist = generateChecklistItems(jadwal.ruangan.tipeArea)
        }
        
        setChecklistData(roomChecklist.map(item => ({
          item,
          checked: false,
          hasProblem: false,
          point: 10
        })))
      } else {
        // Fallback to default checklist if API fails
        const roomChecklist = generateChecklistItems(jadwal.ruangan.tipeArea)
        setChecklistData(roomChecklist.map(item => ({
          item,
          checked: false,
          hasProblem: false,
          point: 10
        })))
      }
    } catch (error) {
      console.error('Error fetching room checklist:', error)
      // Fallback to default checklist if error occurs
      const roomChecklist = generateChecklistItems(jadwal.ruangan.tipeArea)
      setChecklistData(roomChecklist.map(item => ({
        item,
        checked: false,
        hasProblem: false,
        point: 10
      })))
    }
    
    setShowChecklist(true)
    setActiveTab('checklist')
  }

  const generateChecklistItems = (tipeArea: string): string[] => {
    const baseChecklist = [
      'Sapu lantai secara menyeluruh',
      'Pel lantai dengan desinfektan',
      'Lap semua meja dan kursi',
      'Bersihkan jendela dan kaca',
      'Buang sampah di semua tempat sampah',
      'Organisir ulang peralatan'
    ]

    const specificChecklist: Record<string, string[]> = {
      'Toilet': [
        'Sapu dan lantai kering',
        'Bersihkan closet dengan desinfektan',
        'Lap wastafel dan cermin',
        'Isi ulang tissue dan sabun',
        'Bersihkan lantai dengan cairan pembersih',
        'Periksa dan bersihkan saluran air'
      ],
      'Dapur': [
        'Bersihkan semua permukaan dapur',
        'Lap kompor dan oven',
        'Bersihkan kulkas dan microwave',
        'Cuci semua peralatan makan',
        'Organisir pantry',
        'Periksa kebersihan tempat cuci piring'
      ],
      'Ruang Meeting': [
        'Lap semua meja meeting',
        'Bersihkan kursi',
        'Lap whiteboard',
        'Organisir peralatan presentasi',
        'Bersihkan jendela',
        'Atur ulang konfigurasi ruangan'
      ]
    }

    return specificChecklist[tipeArea] || baseChecklist
  }

  const handleChecklistChange = (index: number, checked: boolean) => {
    const newChecklist = [...checklistData]
    newChecklist[index].checked = checked
    setChecklistData(newChecklist)
  }

  const handleProblemToggle = (index: number, hasProblem: boolean) => {
    const newChecklist = [...checklistData]
    newChecklist[index].hasProblem = hasProblem
    setChecklistData(newChecklist)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setChecklistPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmitChecklist = async () => {
    if (!selectedJadwal) return

    // Check if all items are checked
    const allChecked = checklistData.every(item => item.checked)
    if (!allChecked) {
      alert('Semua checklist harus diisi sebelum menyelesaikan tugas!')
      return
    }

    setIsSubmitting(true)
    try {
      const checklistJson = JSON.stringify(checklistData)
      
      const response = await API_CONFIG.apiRequest('/api/laporan', {
        method: 'POST',
        body: JSON.stringify({
          jadwalId: selectedJadwal.id,
          checklist: checklistJson,
          fotoMasalah: checklistPhoto,
          komentar: checklistComments
        }),
      })

      if (response.ok) {
        alert('Laporan berhasil disubmit!')
        setShowChecklist(false)
        setSelectedJadwal(null)
        setChecklistData([])
        setChecklistComments('')
        setChecklistPhoto('')
        
        // Refresh data
        fetchTodaySchedule()
        fetchLaporan()
        setActiveTab('jadwal')
      } else {
        alert('Gagal menyimpan laporan')
      }
    } catch (error) {
      console.error('Error submitting checklist:', error)
      alert('Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getTaskStatus = (jamMulai: string, jamSelesai: string, status: string) => {
    if (status === 'Completed' || status === 'In Progress') return status
    
    const now = currentTime
    const [startHour, startMinute] = jamMulai.split(':').map(Number)
    const [endHour, endMinute] = jamSelesai.split(':').map(Number)
    
    const startTime = new Date(now)
    startTime.setHours(startHour, startMinute, 0, 0)
    
    const endTime = new Date(now)
    endTime.setHours(endHour, endMinute, 0, 0)
    
    if (now >= startTime && now <= endTime) {
      return 'Should Start'
    } else if (now > endTime) {
      return 'Overdue'
    } else {
      return 'Scheduled'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <User className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Dashboard Pegawai</h1>
                <p className="text-sm text-slate-500">Selamat datang, {profileData?.namaLengkap || 'Loading...'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <NotificationSystem role="pegawai" userId={profileData?.id || ''} />
              <Badge variant="outline" className="text-green-600 border-green-600">
                {profileData?.status || 'Loading...'}
              </Badge>
              <LogoutButton 
                user={{
                  namaLengkap: profileData?.namaLengkap || 'Pegawai',
                  role: 'Pegawai',
                  username: profileData?.username || 'pegawai'
                }} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="jadwal">Jadwal</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="laporan">Laporan</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Jadwal Tab */}
          <TabsContent value="jadwal" className="space-y-6">
            {/* Today's Schedule */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Jadwal Hari Ini</h2>
                <div className="text-sm text-slate-500">
                  {new Date().toLocaleString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
              {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        <div className="h-8 bg-slate-200 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {todaySchedule.length > 0 ? todaySchedule.map((schedule, index) => {
                    const taskStatus = getTaskStatus(schedule.jamMulai, schedule.jamSelesai, schedule.status)
                    return (
                    <Card key={schedule.id} className={
                      taskStatus === 'In Progress' ? 'border-blue-200 bg-blue-50' : 
                      taskStatus === 'Should Start' ? 'border-yellow-200 bg-yellow-50' :
                      taskStatus === 'Overdue' ? 'border-red-200 bg-red-50' :
                      index === 0 && taskStatus === 'Scheduled' ? 'border-orange-200 bg-orange-50' : ''
                    }>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {schedule.namaTugas}
                          {index === 0 && taskStatus === 'Scheduled' && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Terdekat
                            </Badge>
                          )}
                          {taskStatus === 'Should Start' && (
                            <Badge variant="secondary" className="text-xs bg-yellow-200 text-yellow-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Harus Dimulai
                            </Badge>
                          )}
                          {taskStatus === 'Overdue' && (
                            <Badge variant="destructive" className="text-xs">
                              <X className="h-3 w-3 mr-1" />
                              Terlewat
                            </Badge>
                          )}
                        </CardTitle>
                        <Badge variant={
                          taskStatus === 'Completed' ? 'default' : 
                          taskStatus === 'In Progress' ? 'secondary' :
                          taskStatus === 'Should Start' ? 'secondary' :
                          taskStatus === 'Overdue' ? 'destructive' : 'outline'
                        }>
                          {taskStatus === 'Should Start' ? 'Harus Dimulai' :
                           taskStatus === 'Overdue' ? 'Terlewat' : taskStatus}
                        </Badge>
                      </div>
                      <CardDescription>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4" />
                          {schedule.ruangan.nama} ({schedule.ruangan.tipeArea})
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <Clock className="h-4 w-4" />
                          {schedule.jamMulai} - {schedule.jamSelesai}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {taskStatus === 'Scheduled' && (
                        <Button 
                          className="w-full"
                          onClick={() => handleStartTask(schedule)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Mulai Kerjakan
                        </Button>
                      )}
                      {(taskStatus === 'Should Start' || taskStatus === 'Overdue') && (
                        <Button 
                          className="w-full"
                          variant={taskStatus === 'Overdue' ? 'destructive' : 'default'}
                          onClick={() => handleStartTask(schedule)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {taskStatus === 'Overdue' ? 'Kerjakan Sekarang' : 'Mulai Kerjakan'}
                        </Button>
                      )}
                      {taskStatus === 'In Progress' && (
                        <Button 
                          className="w-full"
                          onClick={() => handleStartTask(schedule)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Lanjutkan Checklist
                        </Button>
                      )}
                      {taskStatus === 'Completed' && (
                        <div className="space-y-2">
                          <p className="text-sm text-green-600 font-medium">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            Tugas selesai
                          </p>
                          <p className="text-xs text-slate-500">
                            Laporan telah disubmit dan menunggu verifikasi
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}) : (
                  <Card className="col-span-2">
                    <CardContent className="p-6 text-center">
                      <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-500">Tidak ada jadwal untuk hari ini</p>
                    </CardContent>
                  </Card>
                )}
                </div>
              )}
            </div>

            {/* Upcoming Schedule */}
            <div>
              <h2 className="text-xl font-bold mb-4">Jadwal Akan Datang</h2>
              {isLoading ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    {upcomingSchedule.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingSchedule.map((schedule, index) => (
                        <div key={schedule.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                          index === 0 ? 'border-orange-200 bg-orange-50' : ''
                        }`}>
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {schedule.namaTugas}
                                {index === 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Terdekat
                                  </Badge>
                                )}
                              </p>
                              <p className="text-sm text-slate-500">{schedule.ruangan.nama} ({schedule.ruangan.tipeArea})</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{new Date(schedule.hariTanggal).toLocaleDateString('id-ID')}</p>
                            <p className="text-xs text-slate-500">{schedule.jamMulai} - {schedule.jamSelesai}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-slate-500">
                      <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p>Tidak ada jadwal yang akan datang</p>
                    </div>
                  )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-6">
            {showChecklist && selectedJadwal ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">Checklist Tugas</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedJadwal.namaTugas}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {selectedJadwal.ruangan.nama} ({selectedJadwal.ruangan.tipeArea}) • {selectedJadwal.jamMulai} - {selectedJadwal.jamSelesai}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {checklistData.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <input 
                                type="checkbox" 
                                className="h-4 w-4 text-primary rounded"
                                id={`checklist-${index}`}
                                checked={item.checked}
                                onChange={(e) => handleChecklistChange(index, e.target.checked)}
                              />
                              <label htmlFor={`checklist-${index}`} className="flex-1 cursor-pointer font-medium">
                                {item.item}
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant={item.hasProblem ? "destructive" : "outline"}
                                size="sm"
                                onClick={() => handleProblemToggle(index, !item.hasProblem)}
                              >
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {item.hasProblem ? 'Ada Masalah' : 'Tidak Ada Masalah'}
                              </Button>
                            </div>
                          </div>
                          {item.hasProblem && (
                            <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                              <p className="font-medium text-red-800">Deskripsi Masalah:</p>
                              <textarea 
                                className="w-full mt-1 p-2 border rounded-md text-sm"
                                rows={2}
                                placeholder="Deskripsikan masalah yang ditemukan..."
                                value={item.problemDescription || ''}
                                onChange={(e) => {
                                  const newChecklist = [...checklistData]
                                  newChecklist[index].problemDescription = e.target.value
                                  setChecklistData(newChecklist)
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Komentar Tambahan (jika ada)</label>
                          <textarea 
                            className="w-full mt-1 p-2 border rounded-md"
                            rows={3}
                            placeholder="Tambahkan komentar atau catatan tambahan..."
                            value={checklistComments}
                            onChange={(e) => setChecklistComments(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Upload Foto Masalah (jika ada)</label>
                          <div className="mt-1">
                            {checklistPhoto ? (
                              <div className="relative">
                                <img 
                                  src={checklistPhoto} 
                                  alt="Problem photo" 
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-2 right-2"
                                  onClick={() => setChecklistPhoto('')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                  className="hidden"
                                  id="photo-upload"
                                />
                                <label htmlFor="photo-upload" className="cursor-pointer">
                                  <Camera className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                                  <p className="text-sm text-slate-500">Klik untuk upload foto masalah</p>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setShowChecklist(false)
                          setSelectedJadwal(null)
                          setChecklistData([])
                        }}
                      >
                        Batal
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={handleSubmitChecklist}
                        disabled={isSubmitting || !checklistData.every(item => item.checked)}
                      >
                        {isSubmitting ? 'Menyimpan...' : 'Selesaikan Checklist'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Tidak Ada Tugas Aktif</h3>
                  <p className="text-slate-500 mb-4">Pilih jadwal dari tab "Jadwal" untuk memulai checklist</p>
                  <Button onClick={() => setActiveTab('jadwal')}>
                    Lihat Jadwal
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Laporan Tab */}
          <TabsContent value="laporan" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Laporan Inspeksi</h2>
              {laporanList.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {laporanList.map((report) => (
                    <Card key={report.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{report.jadwal.ruangan.nama}</CardTitle>
                          <Badge variant={
                            report.status === 'Verified' ? 'default' : 
                            report.status === 'Pending' ? 'secondary' : 'destructive'
                          }>
                            {report.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          {report.jadwal.namaTugas} • {new Date(report.createdAt).toLocaleDateString('id-ID')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Completion:</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{ width: `${report.persentase}%` }}
                                />
                              </div>
                              <span className="text-sm">{report.persentase.toFixed(1)}%</span>
                            </div>
                          </div>
                          
                          {report.inspeksi.length > 0 && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">Rating:</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < report.inspeksi[0].rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-slate-500">
                                ({report.inspeksi[0].rating}/5)
                              </span>
                            </div>
                          )}
                          
                          {report.inspeksi[0]?.komentar && (
                            <div>
                              <p className="text-sm font-medium">Komentar Inspeksi:</p>
                              <p className="text-sm text-slate-600">{report.inspeksi[0].komentar}</p>
                            </div>
                          )}
                          
                          {report.komentar && (
                            <div>
                              <p className="text-sm font-medium">Komentar Pegawai:</p>
                              <p className="text-sm text-slate-600">{report.komentar}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">Belum ada laporan inspeksi</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Profile Saya</h2>
              {profileData ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-xl font-medium">
                          {getInitials(profileData.namaLengkap)}
                        </span>
                      </div>
                      <div>
                        <CardTitle className="text-xl">{profileData.namaLengkap}</CardTitle>
                        <CardDescription className="text-blue-600 font-medium">{profileData.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Username</p>
                        <p className="text-sm font-medium">{profileData.username}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Nomor Surat Kontrak</p>
                        <p className="text-sm text-blue-600">{profileData.suratKontrak || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Jenis Kelamin</p>
                        <p className="text-sm">{profileData.jenisKelamin}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Nomor Telepon</p>
                        <p className="text-sm">{profileData.nomorTelp}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Kantor</p>
                        <p className="text-sm">{profileData.kantor?.nama || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Tanggal Masuk</p>
                        <p className="text-sm">{new Date(profileData.tanggalMasuk).toLocaleDateString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">Status</p>
                        <Badge variant="default" className="bg-green-100 text-green-800">{profileData.status}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500">ID Pegawai</p>
                        <p className="text-sm font-mono text-slate-400">{profileData.id.slice(-8)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <User className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">Loading profile data...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}