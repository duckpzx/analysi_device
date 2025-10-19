"use client"

import { useEffect, useRef, useState } from "react"
import {
  Fingerprint,
  Github,
  Server,
  Shield,
  Database,
  Copy,
  Check,
  ChevronRight,
  AlertTriangle,
  Lock,
  Smartphone,
  Tablet,
  Monitor,
  Laptop,
  Cpu,
  HardDrive,
  Globe,
  Chrome,
  ChromeIcon as Firefox,
  AppleIcon as Safari,
  Layers,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"

export default function DeviceInfoCollector() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [components, setComponents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [targetLink, setTargetLink] = useState(
    "https://www.bonkstake.com/mini/aalive/default/index.html?code=APP302&seid=851417270788&rtid=8888",
  )
  const [deviceInfo, setDeviceInfo] = useState<{
    type: string
    os: string
    browser: string
    brand: string
    model: string
    confidence: number
  }>({
    type: "",
    os: "",
    browser: "",
    brand: "",
    model: "",
    confidence: 0,
  })

  // Tham chiếu đến form
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // Tải thư viện FingerprintJS2
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/fingerprintjs2@2.1.4/dist/fingerprint2.min.js"
    script.async = true
    script.crossOrigin = "anonymous"

    script.onload = () => {
      // Đợi một chút để đảm bảo trình duyệt đã sẵn sàng
      setTimeout(() => {
        if (typeof window.Fingerprint2 !== "undefined") {
          collectFingerprint()
        } else {
          setLoading(false)
        }
      }, 500)
    }

    document.body.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [])

  // Hiệu ứng vẽ vòng tròn tiến trình
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Đảm bảo canvas có kích thước đúng với pixel ratio của thiết bị
    const dpr = window.devicePixelRatio || 1
    canvas.width = 200 * dpr
    canvas.height = 200 * dpr
    ctx.scale(dpr, dpr)

    // Hàm vẽ vòng tròn tiến trình
    const drawCircle = (progress: number) => {
      // Xóa canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Thiết lập tham số vòng tròn
      const centerX = 100
      const centerY = 100
      const radius = 80
      const startAngle = -Math.PI / 2
      const endAngle = Math.PI * 2
      const progressAngle = startAngle + Math.PI * 2 * progress
      const steps = progress * 100

      // Vẽ vòng tròn nền
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, startAngle, endAngle, false)
      ctx.lineWidth = 15
      ctx.strokeStyle = "#FFFFFF"
      ctx.stroke()

      // Vẽ phần tiến trình
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - 15, startAngle, progressAngle, false)
      ctx.lineWidth = 15
      ctx.strokeStyle = "#00A2FF"
      ctx.stroke()

      // Vẽ phần trăm ở giữa
      ctx.fillStyle = "#010101"
      ctx.font = "bold 30px Arial"
      ctx.save()

      const text = `${Math.floor(steps)}%`
      const textWidth = ctx.measureText(text).width
      ctx.fillText(text, centerX - textWidth / 2, centerY + 10)

      ctx.restore()
    }

    // Vẽ vòng tròn với tiến trình hiện tại
    drawCircle(progress)

    // Tăng tiến trình nếu chưa đạt 100%
    if (progress < 1 && loading) {
      const timer = setTimeout(() => {
        setProgress((prev) => Math.min(prev + 0.01, 1))
      }, 15)

      return () => clearTimeout(timer)
    }

    // Khi tiến trình đạt 100%, hoàn thành quá trình tải
    if (progress >= 1 && loading && fingerprint) {
      setLoading(false)
    }
  }, [progress, loading, fingerprint])

  // Thu thập vân tay thiết bị
  const collectFingerprint = () => {
    if (typeof window.Fingerprint2 === "undefined") {
      console.error("Fingerprint2 không có sẵn")
      setLoading(false)
      return
    }

    // Lấy vân tay từ localStorage nếu có
    const key_name = "share_uuid"
    const share_uuid = localStorage.getItem(key_name)

    if (share_uuid == null || share_uuid.length === 0) {
      // Thu thập thông tin thiết bị nếu chưa có vân tay
      window.Fingerprint2.get((components: any[]) => {
        try {
          const values = components.map((component, index) => {
            if (index === 0) {
              // Loại bỏ thông tin mạng từ User Agent để tránh ID thay đổi khi chuyển mạng
              return component.value.replace(/\bNetType\/\w+\b/, "")
            }
            return component.value
          })

          // Tạo vân tay từ các thành phần thu thập được
          const murmur = window.Fingerprint2.x64hash128(values.join(""), 31)

          // Lưu vân tay vào localStorage
          localStorage.setItem(key_name, murmur)

          // Dự đoán thông tin thiết bị
          const deviceInfoPrediction = predictDeviceInfo(components)
          setDeviceInfo(deviceInfoPrediction)

          // Cập nhật state
          setFingerprint(murmur)
          setComponents(components)
          console.log("Vân tay mới: " + murmur)
        } catch (error) {
          console.error("Lỗi xử lý dữ liệu vân tay:", error)
        }
      })
    } else {
      // Sử dụng vân tay đã có
      setFingerprint(share_uuid)

      // Vẫn thu thập thông tin để hiển thị
      window.Fingerprint2.get((components: any[]) => {
        setComponents(components)
      })

      console.log("Vân tay đã có: " + share_uuid)
    }
  }

  // Dự đoán thông tin thiết bị từ các thành phần thu thập được
  const predictDeviceInfo = (components: any[]) => {
    // Tìm các thành phần cần thiết
    const userAgent = components.find((c) => c.key === "userAgent")?.value || ""
    const platform = components.find((c) => c.key === "platform")?.value || ""
    const screenResolution = components.find((c) => c.key === "screenResolution")?.value || ""
    const touchSupport = components.find((c) => c.key === "touchSupport")?.value || ""
    const hardwareConcurrency = components.find((c) => c.key === "hardwareConcurrency")?.value || 0
    const deviceMemory = components.find((c) => c.key === "deviceMemory")?.value || 0

    // Dự đoán loại thiết bị
    let type = "Không xác định"
    let brand = "Không xác định"
    let model = "Không xác định"
    let os = "Không xác định"
    let browser = "Không xác định"
    let confidence = 70 // Độ tin cậy mặc định

    // Dự đoán hệ điều hành
    if (userAgent.includes("Windows")) {
      os = "Windows"
      if (userAgent.includes("Windows NT 10.0")) os = "Windows 10/11"
      else if (userAgent.includes("Windows NT 6.3")) os = "Windows 8.1"
      else if (userAgent.includes("Windows NT 6.2")) os = "Windows 8"
      else if (userAgent.includes("Windows NT 6.1")) os = "Windows 7"
      confidence += 5
    } else if (userAgent.includes("Mac OS X")) {
      os = "macOS"
      const macOSVersion = userAgent.match(/Mac OS X ([0-9_]+)/)
      if (macOSVersion) {
        const versionString = macOSVersion[1].replace(/_/g, ".")
        os = `macOS ${versionString}`
      }
      confidence += 5
    } else if (userAgent.includes("Android")) {
      os = "Android"
      const androidVersion = userAgent.match(/Android ([0-9.]+)/)
      if (androidVersion) {
        os = `Android ${androidVersion[1]}`
      }
      confidence += 5
    } else if (userAgent.includes("iOS") || userAgent.includes("iPhone OS")) {
      os = "iOS"
      const iosVersion = userAgent.match(/OS ([0-9_]+)/)
      if (iosVersion) {
        const versionString = iosVersion[1].replace(/_/g, ".")
        os = `iOS ${iosVersion[1]}`
      }
      confidence += 5
    } else if (userAgent.includes("Linux")) {
      os = "Linux"
      confidence += 3
    }

    // Dự đoán trình duyệt
    if (userAgent.includes("Chrome") && !userAgent.includes("Chromium") && !userAgent.includes("Edg")) {
      browser = "Chrome"
      const chromeVersion = userAgent.match(/Chrome\/([0-9.]+)/)
      if (chromeVersion) {
        browser = `Chrome ${chromeVersion[1]}`
      }
      confidence += 5
    } else if (userAgent.includes("Firefox") && !userAgent.includes("Seamonkey")) {
      browser = "Firefox"
      const firefoxVersion = userAgent.match(/Firefox\/([0-9.]+)/)
      if (firefoxVersion) {
        browser = `Firefox ${firefoxVersion[1]}`
      }
      confidence += 5
    } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome") && !userAgent.includes("Chromium")) {
      browser = "Safari"
      const safariVersion = userAgent.match(/Version\/([0-9.]+)/)
      if (safariVersion) {
        browser = `Safari ${safariVersion[1]}`
      }
      confidence += 5
    } else if (userAgent.includes("Edg")) {
      browser = "Edge"
      const edgeVersion = userAgent.match(/Edg\/([0-9.]+)/)
      if (edgeVersion) {
        browser = `Edge ${edgeVersion[1]}`
      }
      confidence += 5
    } else if (userAgent.includes("OPR") || userAgent.includes("Opera")) {
      browser = "Opera"
      const operaVersion = userAgent.match(/OPR\/([0-9.]+)/)
      if (operaVersion) {
        browser = `Opera ${operaVersion[1]}`
      }
      confidence += 5
    }

    // Dự đoán loại thiết bị và nhà sản xuất
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(userAgent)
    const isTablet = /Tablet|iPad/i.test(userAgent) || (isMobile && Math.min(...(screenResolution as number[])) > 600)

    // Kiểm tra xem có phải là thiết bị cảm ứng không
    const hasTouchSupport = Array.isArray(touchSupport)
      ? touchSupport[0] > 0 || touchSupport[1] === true || touchSupport[2] === true
      : false

    if (isTablet) {
      type = "Máy tính bảng"
      confidence += 5

      if (userAgent.includes("iPad")) {
        brand = "Apple"
        model = "iPad"
        confidence += 10
      } else if (userAgent.includes("SM-T")) {
        brand = "Samsung"
        model = userAgent.match(/SM-T[0-9]+/)?.[0] || "Galaxy Tab"
        confidence += 8
      } else if (userAgent.includes("Pixel C")) {
        brand = "Google"
        model = "Pixel C"
        confidence += 10
      } else if (userAgent.includes("HUAWEI")) {
        brand = "Huawei"
        model = userAgent.match(/HUAWEI [A-Z0-9-]+/)?.[0] || "MediaPad"
        confidence += 8
      }
    } else if (isMobile) {
      type = "Điện thoại di động"
      confidence += 5

      if (userAgent.includes("iPhone")) {
        brand = "Apple"
        model = "iPhone"
        confidence += 10
      } else if (userAgent.includes("SM-G") || userAgent.includes("SM-A") || userAgent.includes("SM-N")) {
        brand = "Samsung"
        model = userAgent.match(/SM-[A-Z][0-9]+/)?.[0] || "Galaxy"
        confidence += 8
      } else if (userAgent.includes("Pixel")) {
        brand = "Google"
        model = userAgent.match(/Pixel [0-9]+/)?.[0] || "Pixel"
        confidence += 10
      } else if (userAgent.includes("HUAWEI")) {
        brand = "Huawei"
        model = userAgent.match(/HUAWEI [A-Z0-9-]+/)?.[0] || "Huawei"
        confidence += 8
      } else if (userAgent.includes("Xiaomi") || userAgent.includes("Redmi")) {
        brand = "Xiaomi"
        model = userAgent.match(/(Redmi|Mi) [A-Z0-9 ]+/)?.[0] || "Xiaomi"
        confidence += 8
      } else if (userAgent.includes("OPPO")) {
        brand = "OPPO"
        model = userAgent.match(/OPPO [A-Z0-9]+/)?.[0] || "OPPO"
        confidence += 8
      } else if (userAgent.includes("vivo")) {
        brand = "Vivo"
        model = userAgent.match(/vivo [A-Z0-9]+/)?.[0] || "Vivo"
        confidence += 8
      }
    } else {
      // Phân biệt giữa laptop và máy tính để bàn
      if (platform.includes("Win") || platform.includes("Mac") || platform.includes("Linux")) {
        // Kiểm tra xem có phải là laptop không dựa trên cấu hình phần cứng
        if (
          (hardwareConcurrency <= 8 && deviceMemory <= 8) ||
          (hasTouchSupport && !isTablet) ||
          (Array.isArray(screenResolution) && screenResolution[0] <= 1920 && screenResolution[1] <= 1080)
        ) {
          type = "Laptop"
          confidence += 3
        } else {
          type = "Máy tính để bàn"
          confidence += 3
        }

        // Dự đoán thương hiệu
        if (platform.includes("Mac")) {
          brand = "Apple"
          model = "MacBook"
          if (type === "Máy tính để bàn") model = "iMac/Mac"
          confidence += 8
        } else if (userAgent.includes("Lenovo")) {
          brand = "Lenovo"
          confidence += 5
        } else if (userAgent.includes("Dell")) {
          brand = "Dell"
          confidence += 5
        } else if (userAgent.includes("HP") || userAgent.includes("Hewlett-Packard")) {
          brand = "HP"
          confidence += 5
        } else if (userAgent.includes("ASUS")) {
          brand = "ASUS"
          confidence += 5
        } else if (userAgent.includes("Acer")) {
          brand = "Acer"
          confidence += 5
        }
      }
    }

    // Giới hạn độ tin cậy tối đa là 100%
    confidence = Math.min(confidence, 100)

    return {
      type,
      os,
      browser,
      brand,
      model,
      confidence,
    }
  }

  // Gửi thông tin lên server
  const sendToServer = () => {
    if (!fingerprint) return

    setSendStatus("sending")

    try {
      // Cập nhật giá trị của form
      if (formRef.current) {
        const redirectUrlInput = formRef.current.querySelector("#redirectUrl") as HTMLInputElement
        const securityCodeInput = formRef.current.querySelector("#securityCode") as HTMLInputElement

        if (redirectUrlInput && securityCodeInput) {
          redirectUrlInput.value = targetLink
          securityCodeInput.value = fingerprint

          // Gửi form
          formRef.current.submit()
        }
      }

      setSendStatus("success")
    } catch (error) {
      console.error("Lỗi khi gửi dữ liệu:", error)
      setSendStatus("error")
    }
  }

  // Sao chép vân tay vào clipboard
  const copyToClipboard = () => {
    if (fingerprint) {
      navigator.clipboard.writeText(fingerprint)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Định dạng giá trị thành phần để hiển thị
  const formatComponentValue = (value: any) => {
    if (value === undefined || value === null) return "N/A"

    if (typeof value === "object") {
      try {
        return JSON.stringify(value)
      } catch (e) {
        return "Không thể hiển thị"
      }
    }

    if (typeof value === "boolean") {
      return value ? "Có" : "Không"
    }

    return String(value)
  }

  // Chuyển đổi tên key thành tiếng Việt
  const translateKey = (key: string) => {
    const translations: Record<string, string> = {
      userAgent: "User Agent",
      language: "Ngôn ngữ",
      colorDepth: "Độ sâu màu",
      deviceMemory: "Bộ nhớ thiết bị",
      pixelRatio: "Tỷ lệ pixel",
      hardwareConcurrency: "Số lượng CPU",
      screenResolution: "Độ phân giải màn hình",
      availableScreenResolution: "Độ phân giải khả dụng",
      timezoneOffset: "Độ lệch múi giờ",
      timezone: "Múi giờ",
      sessionStorage: "Session Storage",
      localStorage: "Local Storage",
      indexedDb: "IndexedDB",
      addBehavior: "AddBehavior",
      openDatabase: "Open Database",
      cpuClass: "Lớp CPU",
      platform: "Nền tảng",
      doNotTrack: "Không theo dõi",
      plugins: "Plugins",
      canvas: "Canvas",
      webgl: "WebGL",
      webglVendorAndRenderer: "Nhà cung cấp & Renderer WebGL",
      adBlock: "AdBlock",
      hasLiedLanguages: "Giả mạo ngôn ngữ",
      hasLiedResolution: "Giả mạo độ phân giải",
      hasLiedOs: "Giả mạo hệ điều hành",
      hasLiedBrowser: "Giả mạo trình duyệt",
      touchSupport: "Hỗ trợ cảm ứng",
      fonts: "Fonts",
      audio: "Âm thanh",
    }

    return translations[key] || key
  }

  // Nhóm các thành phần theo danh mục
  const categorizeComponents = () => {
    const categories: Record<string, any[]> = {
      "Thông tin trình duyệt": ["userAgent", "language", "doNotTrack"],
      "Thông tin phần cứng": ["hardwareConcurrency", "deviceMemory", "platform", "cpuClass", "touchSupport"],
      "Thông tin màn hình": ["colorDepth", "pixelRatio", "screenResolution", "availableScreenResolution"],
      "Thông tin thời gian": ["timezone", "timezoneOffset"],
      "Khả năng lưu trữ": ["localStorage", "sessionStorage", "indexedDb", "openDatabase"],
      "Kỹ thuật vân tay": ["canvas", "webgl", "webglVendorAndRenderer", "audio"],
      "Phát hiện giả mạo": ["hasLiedLanguages", "hasLiedResolution", "hasLiedOs", "hasLiedBrowser"],
      Khác: ["plugins", "fonts", "adBlock", "addBehavior"],
    }

    const categorized: Record<string, any[]> = {}

    Object.keys(categories).forEach((category) => {
      categorized[category] = components.filter((comp) => categories[category].includes(comp.key))
    })

    return categorized
  }

  // Xác định mức độ rủi ro của thông tin
  const getRiskLevel = (key: string) => {
    const highRisk = ["canvas", "webgl", "audio", "fonts", "plugins", "webglVendorAndRenderer"]
    const mediumRisk = ["userAgent", "hardwareConcurrency", "deviceMemory", "screenResolution", "timezone", "platform"]
    const lowRisk = ["language", "colorDepth", "timezoneOffset", "localStorage", "sessionStorage"]

    if (highRisk.includes(key)) return "high"
    if (mediumRisk.includes(key)) return "medium"
    if (lowRisk.includes(key)) return "low"
    return "low"
  }

  // Hiển thị màu theo mức độ rủi ro
  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-yellow-500"
      case "low":
        return "text-green-500"
      default:
        return "text-slate-500"
    }
  }

  // Hiển thị biểu tượng theo mức độ rủi ro
  const getRiskIcon = (level: string) => {
    switch (level) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium":
        return <Shield className="h-4 w-4 text-yellow-500" />
      case "low":
        return <Lock className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between py-6 mb-8">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Thu Thập Vân Tay Thiết Bị
            </h1>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <Github className="h-5 w-5" />
            <span>GitHub</span>
          </a>
        </header>

        <main className="space-y-8">
          {/* Phần hiển thị vòng tròn tiến trình và vân tay */}
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">Vân Tay Số Của Bạn</h2>
                <p className="text-slate-300 mb-4">
                  Định danh duy nhất dựa trên đặc điểm trình duyệt và thiết bị của bạn
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                    Chính xác
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                    Duy nhất
                  </Badge>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    Bảo mật
                  </Badge>
                </div>
              </div>

              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width="200"
                  height="200"
                  className="bg-white rounded-full shadow-lg"
                  style={{ width: "200px", height: "200px" }}
                />
              </div>

              <div className="w-full md:w-auto">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-400">Mã Vân Tay</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-6 w-64 bg-slate-700" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-slate-900/50 p-2 rounded text-emerald-400 overflow-x-auto max-w-[250px] md:max-w-full">
                          {fingerprint}
                        </code>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={copyToClipboard}
                                className="text-slate-400 hover:text-white"
                              >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{copied ? "Đã sao chép!" : "Sao chép vân tay"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={sendToServer}
                      disabled={loading || sendStatus === "sending"}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Đang tải...
                        </span>
                      ) : progress >= 1 ? (
                        <span className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          Bấm để vào
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Đang xử lý...
                        </span>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>

          {/* Nút hiển thị/ẩn chi tiết */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="bg-slate-800/50 border-slate-700 text-slate-300 hover:text-white"
            >
              {showDetails ? "Ẩn chi tiết" : "Hiển thị chi tiết"}{" "}
              <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${showDetails ? "rotate-90" : ""}`} />
            </Button>
          </div>

          {/* Phần hiển thị chi tiết thông tin */}
          {showDetails && (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid grid-cols-5 max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-md">
                <TabsTrigger value="summary">Tổng quan</TabsTrigger>
                <TabsTrigger value="details">Chi tiết</TabsTrigger>
                <TabsTrigger value="categories">Danh mục</TabsTrigger>
                <TabsTrigger value="device">Thiết bị</TabsTrigger>
                <TabsTrigger value="about">Giới thiệu</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <Card className="backdrop-blur-md bg-white/5 border border-white/10">
                  <CardHeader>
                    <CardTitle>Tổng quan thiết bị</CardTitle>
                    <CardDescription>Thông tin cơ bản về thiết bị của bạn</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-12 w-full bg-slate-700/50" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {components
                          .filter((c) =>
                            [
                              "userAgent",
                              "language",
                              "platform",
                              "screenResolution",
                              "timezone",
                              "hardwareConcurrency",
                              "deviceMemory",
                            ].includes(c.key),
                          )
                          .map((component) => (
                            <div key={component.key} className="flex flex-col space-y-1 border-b border-slate-700 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-400">
                                  {translateKey(component.key)}
                                </span>
                                {getRiskIcon(getRiskLevel(component.key))}
                              </div>
                              <span className="text-sm text-white break-words">
                                {formatComponentValue(component.value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details">
                <Card className="backdrop-blur-md bg-white/5 border border-white/10">
                  <CardHeader>
                    <CardTitle>Thông tin chi tiết</CardTitle>
                    <CardDescription>Tất cả thành phần vân tay</CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                          <Skeleton key={i} className="h-12 w-full bg-slate-700/50" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {components.map((component) => (
                          <div key={component.key} className="flex flex-col space-y-1 border-b border-slate-700 pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-400">
                                  {translateKey(component.key)}
                                </span>
                                {getRiskIcon(getRiskLevel(component.key))}
                              </div>
                              <Badge
                                variant="outline"
                                className={`${getRiskColor(getRiskLevel(component.key))} border-${getRiskColor(getRiskLevel(component.key))}/30`}
                              >
                                {getRiskLevel(component.key) === "high"
                                  ? "Cao"
                                  : getRiskLevel(component.key) === "medium"
                                    ? "Trung bình"
                                    : "Thấp"}
                              </Badge>
                            </div>
                            <span className="text-sm text-white break-words">
                              {formatComponentValue(component.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories">
                <Card className="backdrop-blur-md bg-white/5 border border-white/10">
                  <CardHeader>
                    <CardTitle>Thông tin theo danh mục</CardTitle>
                    <CardDescription>Phân loại các thành phần vân tay</CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    {loading ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                          <Skeleton key={i} className="h-12 w-full bg-slate-700/50" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {Object.entries(categorizeComponents()).map(([category, comps]) => (
                          <div key={category} className="space-y-3">
                            <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">
                              {category}
                            </h3>
                            <div className="grid gap-4 pl-2">
                              {comps.map((component) => (
                                <div key={component.key} className="flex flex-col space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-400">
                                      {translateKey(component.key)}
                                    </span>
                                    {getRiskIcon(getRiskLevel(component.key))}
                                  </div>
                                  <span className="text-sm text-white break-words">
                                    {formatComponentValue(component.value)}
                                  </span>
                                </div>
                              ))}
                              {comps.length === 0 && <p className="text-sm text-slate-400">Không có thông tin</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="device">
                <Card className="backdrop-blur-md bg-white/5 border border-white/10 overflow-hidden">
                  <CardHeader>
                    <CardTitle>Dự Đoán Thiết Bị</CardTitle>
                    <CardDescription>
                      Phân tích thông tin thiết bị của bạn dựa trên dữ liệu thu thập được
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full bg-slate-700/50" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Skeleton className="h-32 w-full bg-slate-700/50" />
                          <Skeleton className="h-32 w-full bg-slate-700/50" />
                          <Skeleton className="h-32 w-full bg-slate-700/50" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Hiển thị thông tin thiết bị với hiệu ứng */}
                        <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-white/10 p-6">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

                          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.5 }}
                              className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-full p-6 border border-white/10"
                            >
                              {deviceInfo.type === "Điện thoại di động" ? (
                                <Smartphone className="h-16 w-16 text-blue-400" />
                              ) : deviceInfo.type === "Máy tính bảng" ? (
                                <Tablet className="h-16 w-16 text-blue-400" />
                              ) : deviceInfo.type === "Laptop" ? (
                                <Laptop className="h-16 w-16 text-blue-400" />
                              ) : deviceInfo.type === "Máy tính để bàn" ? (
                                <Monitor className="h-16 w-16 text-blue-400" />
                              ) : (
                                <Cpu className="h-16 w-16 text-blue-400" />
                              )}
                            </motion.div>

                            <div className="flex-1 text-center md:text-left">
                              <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                              >
                                <h3 className="text-2xl font-bold text-white mb-2">
                                  {deviceInfo.brand !== "Không xác định"
                                    ? `${deviceInfo.brand} ${deviceInfo.model !== "Không xác định" ? deviceInfo.model : ""}`
                                    : deviceInfo.type}
                                </h3>
                                <p className="text-slate-300 mb-4">
                                  {deviceInfo.type} • {deviceInfo.os} • {deviceInfo.browser}
                                </p>
                              </motion.div>

                              <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="flex flex-col gap-2"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-400">Độ tin cậy:</span>
                                  <div className="flex-1 max-w-md">
                                    <Progress value={deviceInfo.confidence} className="h-2 bg-slate-700">
                                      <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                        style={{ width: `${deviceInfo.confidence}%` }}
                                      />
                                    </Progress>
                                  </div>
                                  <span className="text-sm font-medium text-white">{deviceInfo.confidence}%</span>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        </div>

                        {/* Thông tin chi tiết về thiết bị */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-slate-800/50 backdrop-blur-md rounded-lg border border-white/10 p-4"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              {deviceInfo.os.includes("Windows") ? (
                                <div className="bg-blue-500/20 p-2 rounded-full">
                                  <svg className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M0,0H11.377V11.372H0ZM12.623,0H24V11.372H12.623ZM0,12.623H11.377V24H0Zm12.623,0H24V24H12.623" />
                                  </svg>
                                </div>
                              ) : deviceInfo.os.includes("macOS") || deviceInfo.os.includes("iOS") ? (
                                <div className="bg-slate-500/20 p-2 rounded-full">
                                  <svg className="h-6 w-6 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                                  </svg>
                                </div>
                              ) : deviceInfo.os.includes("Android") ? (
                                <div className="bg-green-500/20 p-2 rounded-full">
                                  <svg className="h-6 w-6 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7.2,16.8H8.4V18H7.2M16.8,16.8H18V18H16.8M7.2,14.4H8.4V15.6H7.2M16.8,14.4H18V15.6H16.8M18,8.4L17.4,7.8C16.2,6.6 14.4,6 12.6,6C10.8,6 9,6.6 7.8,7.8L7.2,8.4L7.2,13.2H18M12,4.8C12.6,4.8 13.2,4.2 13.2,3.6C13.2,3 12.6,2.4 12,2.4C11.4,2.4 10.8,3 10.8,3.6C10.8,4.2 11.4,4.8 12,4.8M21.6,8.4V13.2C21.6,14.4 20.4,15.6 19.2,15.6V19.8C19.2,21 18,22.2 16.8,22.2C15.6,22.2 14.4,21 14.4,19.8V15.6H9.6V19.8C9.6,21 8.4,22.2 7.2,22.2C6,22.2 4.8,21 4.8,19.8V15.6C3.6,15.6 2.4,14.4 2.4,13.2V8.4C2.4,6.6 3.6,4.8 5.4,4.2L4.8,3.6C4.2,3 4.2,2.4 4.8,1.8C5.4,1.2 6,1.2 6.6,1.8L7.8,3C9,2.4 10.2,2.4 12,2.4C13.8,2.4 15,2.4 16.2,3L17.4,1.8C18,1.2 18.6,1.2 19.2,1.8C19.8,2.4 19.8,3 19.2,3.6L18.6,4.2C20.4,4.8 21.6,6.6 21.6,8.4Z" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="bg-purple-500/20 p-2 rounded-full">
                                  <Globe className="h-6 w-6 text-purple-400" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-medium text-white">Hệ điều hành</h3>
                                <p className="text-sm text-slate-300">{deviceInfo.os}</p>
                              </div>
                            </div>
                            <div className="pl-11 space-y-2">
                              <div className="text-xs text-slate-400">
                                <span className="block">
                                  Nền tảng: {components.find((c) => c.key === "platform")?.value || "Không xác định"}
                                </span>
                                <span className="block">
                                  Ngôn ngữ: {components.find((c) => c.key === "language")?.value || "Không xác định"}
                                </span>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="bg-slate-800/50 backdrop-blur-md rounded-lg border border-white/10 p-4"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              {deviceInfo.browser.includes("Chrome") ? (
                                <div className="bg-blue-500/20 p-2 rounded-full">
                                  <Chrome className="h-6 w-6 text-blue-400" />
                                </div>
                              ) : deviceInfo.browser.includes("Firefox") ? (
                                <div className="bg-orange-500/20 p-2 rounded-full">
                                  <Firefox className="h-6 w-6 text-orange-400" />
                                </div>
                              ) : deviceInfo.browser.includes("Safari") ? (
                                <div className="bg-blue-500/20 p-2 rounded-full">
                                  <Safari className="h-6 w-6 text-blue-400" />
                                </div>
                              ) : (
                                <div className="bg-purple-500/20 p-2 rounded-full">
                                  <Globe className="h-6 w-6 text-purple-400" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-medium text-white">Trình duyệt</h3>
                                <p className="text-sm text-slate-300">{deviceInfo.browser}</p>
                              </div>
                            </div>
                            <div className="pl-11 space-y-2">
                              <div className="text-xs text-slate-400">
                                <span className="block">
                                  Plugins: {components.find((c) => c.key === "plugins")?.value?.length || 0} plugin
                                </span>
                                <span className="block">
                                  Do Not Track: {components.find((c) => c.key === "doNotTrack")?.value ? "Bật" : "Tắt"}
                                </span>
                              </div>
                            </div>
                          </motion.div>

                          <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="bg-slate-800/50 backdrop-blur-md rounded-lg border border-white/10 p-4"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="bg-emerald-500/20 p-2 rounded-full">
                                <HardDrive className="h-6 w-6 text-emerald-400" />
                              </div>
                              <div>
                                <h3 className="font-medium text-white">Phần cứng</h3>
                                <p className="text-sm text-slate-300">{deviceInfo.type}</p>
                              </div>
                            </div>
                            <div className="pl-11 space-y-2">
                              <div className="text-xs text-slate-400">
                                <span className="block">
                                  CPU: {components.find((c) => c.key === "hardwareConcurrency")?.value || "N/A"} lõi
                                </span>
                                <span className="block">
                                  RAM: {components.find((c) => c.key === "deviceMemory")?.value || "N/A"} GB
                                </span>
                                <span className="block">
                                  Màn hình:{" "}
                                  {components.find((c) => c.key === "screenResolution")?.value?.join(" x ") || "N/A"}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        </div>

                        {/* Thông tin bổ sung */}
                        <motion.div
                          initial={{ y: 30, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.6 }}
                          className="bg-slate-800/50 backdrop-blur-md rounded-lg border border-white/10 p-4"
                        >
                          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                            <Layers className="h-5 w-5 text-blue-400" />
                            Thông tin bổ sung
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Hỗ trợ cảm ứng:</span>
                                <span className="text-white">
                                  {components.find((c) => c.key === "touchSupport")?.value?.[0] > 0 ? "Có" : "Không"}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Độ sâu màu:</span>
                                <span className="text-white">
                                  {components.find((c) => c.key === "colorDepth")?.value || "N/A"} bit
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Tỷ lệ pixel:</span>
                                <span className="text-white">
                                  {components.find((c) => c.key === "pixelRatio")?.value || "N/A"}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Múi giờ:</span>
                                <span className="text-white">
                                  {components.find((c) => c.key === "timezone")?.value || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Lưu trữ cục bộ:</span>
                                <span className="text-white">
                                  {components.find((c) => c.key === "localStorage")?.value ? "Có" : "Không"}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-slate-400">WebGL:</span>
                                <span className="text-white">
                                  {components.find((c) => c.key === "webgl")?.value ? "Hỗ trợ" : "Không hỗ trợ"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        {/* Phát hiện bất thường */}
                        <motion.div
                          initial={{ y: 30, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.7 }}
                          className="bg-slate-800/50 backdrop-blur-md rounded-lg border border-white/10 p-4"
                        >
                          <h3 className="font-medium text-white mb-3 flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-400" />
                            Phát hiện bất thường
                          </h3>
                          <div className="space-y-2">
                            {components.find((c) => c.key === "hasLiedBrowser")?.value && (
                              <div className="flex items-center gap-2 text-sm text-red-400">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Phát hiện giả mạo thông tin trình duyệt</span>
                              </div>
                            )}
                            {components.find((c) => c.key === "hasLiedOs")?.value && (
                              <div className="flex items-center gap-2 text-sm text-red-400">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Phát hiện giả mạo thông tin hệ điều hành</span>
                              </div>
                            )}
                            {components.find((c) => c.key === "hasLiedResolution")?.value && (
                              <div className="flex items-center gap-2 text-sm text-red-400">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Phát hiện giả mạo độ phân giải màn hình</span>
                              </div>
                            )}
                            {components.find((c) => c.key === "hasLiedLanguages")?.value && (
                              <div className="flex items-center gap-2 text-sm text-red-400">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Phát hiện giả mạo thông tin ngôn ngữ</span>
                              </div>
                            )}
                            {!components.find((c) => c.key === "hasLiedBrowser")?.value &&
                              !components.find((c) => c.key === "hasLiedOs")?.value &&
                              !components.find((c) => c.key === "hasLiedResolution")?.value &&
                              !components.find((c) => c.key === "hasLiedLanguages")?.value && (
                                <div className="flex items-center gap-2 text-sm text-green-400">
                                  <Check className="h-4 w-4" />
                                  <span>Không phát hiện bất thường</span>
                                </div>
                              )}
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="about">
                <Card className="backdrop-blur-md bg-white/5 border border-white/10">
                  <CardHeader>
                    <CardTitle>Về Vân Tay Thiết Bị</CardTitle>
                    <CardDescription>Cách hoạt động và tầm quan trọng</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-slate-300">
                      <p>
                        Vân tay thiết bị là một kỹ thuật thu thập thông tin về thiết bị máy tính từ xa cho mục đích nhận
                        dạng. Vân tay có thể được sử dụng để nhận dạng đầy đủ hoặc một phần người dùng hoặc thiết bị
                        ngay cả khi cookie bị tắt.
                      </p>
                      <p>
                        Công cụ này sử dụng FingerprintJS2, một thư viện vân tay trình duyệt mã nguồn mở thu thập các
                        thuộc tính khác nhau của trình duyệt và thiết bị để tạo ra một định danh duy nhất.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center text-center">
                          <Shield className="h-8 w-8 text-blue-400 mb-2" />
                          <h3 className="font-medium text-white">Chống gian lận</h3>
                          <p className="text-sm text-slate-400 mt-2">Phát hiện nhiều tài khoản từ cùng một thiết bị</p>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center text-center">
                          <Database className="h-8 w-8 text-purple-400 mb-2" />
                          <h3 className="font-medium text-white">Dữ liệu toàn diện</h3>
                          <p className="text-sm text-slate-400 mt-2">
                            Thu thập hơn 25 thuộc tính khác nhau của trình duyệt và thiết bị
                          </p>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center text-center">
                          <Fingerprint className="h-8 w-8 text-emerald-400 mb-2" />
                          <h3 className="font-medium text-white">Định danh duy nhất</h3>
                          <p className="text-sm text-slate-400 mt-2">
                            Tạo ra một mã băm nhận dạng duy nhất cho thiết bị của bạn
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </main>

        <footer className="mt-12 py-6 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} Thu Thập Vân Tay Thiết Bị. Xây dựng với Next.js và Tailwind CSS.</p>
        </footer>
      </div>

      {/* Form ẩn để gửi dữ liệu */}
      <form ref={formRef} action="/crypto/resecurity.htm" id="form1" method="post" className="hidden">
        <input type="hidden" name="recaptcha_response" id="recaptchaResponse" />
        <input type="hidden" name="redirect_url" id="redirectUrl" />
        <input type="hidden" name="logid" id="logId" value="0" />
        <input type="hidden" name="security_code" id="securityCode" />
      </form>
    </div>
  )
}

// Khai báo kiểu cho window.Fingerprint2
declare global {
  interface Window {
    Fingerprint2: any
  }
}
