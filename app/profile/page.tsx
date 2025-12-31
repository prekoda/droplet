"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Camera, Save, ArrowLeft, Loader2, User, X, Trash2 } from "lucide-react"
import Link from "next/link"
import Cropper from "react-easy-crop"

// --- Helper for Cropping ---
const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.addEventListener("load", () => resolve(image))
        image.addEventListener("error", (error) => reject(error))
        image.setAttribute("crossOrigin", "anonymous")
        image.src = url
    })

async function getCroppedImg(imageSrc: string, pixelCrop: any) {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) return null

    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    )

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob)
            else reject(new Error("Canvas is empty"))
        }, "image/jpeg")
    })
}

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState("")

    // Form states
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [username, setUsername] = useState("")
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    // Cropping States
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
    const [showCropModal, setShowCropModal] = useState(false)

    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push("/signup")
                return
            }

            setUser(user)

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            if (data) {
                setFirstName(data.first_name || "")
                setLastName(data.last_name || "")
                setUsername(data.username || "")
                setAvatarUrl(data.avatar_url || null)
            }
            setLoading(false)
        }

        getProfile()
    }, [router, supabase])

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0]
            const imageDataUrl = await readFile(file)
            setImageSrc(imageDataUrl as string)
            setShowCropModal(true)
        }
    }

    const readFile = (file: File) => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.addEventListener("load", () => resolve(reader.result), false)
            reader.readAsDataURL(file)
        })
    }

    const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels)
    }, [])

    const handleUploadCroppedImage = async () => {
        try {
            setUploading(true)
            setMessage("")

            if (!imageSrc || !croppedAreaPixels) return

            const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
            if (!croppedImageBlob) throw new Error("Could not crop image")

            const fileExt = "jpg"
            const filePath = `${user.id}/${Math.random()}.${fileExt}`

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, croppedImageBlob)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

            // 3. Auto-Save to DB
            const { error: updateError } = await supabase
                .from("profiles")
                .update({ avatar_url: data.publicUrl, updated_at: new Date().toISOString() })
                .eq("id", user.id)

            if (updateError) throw updateError

            setAvatarUrl(data.publicUrl)
            setShowCropModal(false)
            setImageSrc(null)
            setMessage("Profile picture updated!")
            router.refresh()

        } catch (error: any) {
            console.error("Error uploading avatar:", error)
            console.error("Error details:", JSON.stringify(error, null, 2))
            setMessage(`Error uploading image: ${error.message || JSON.stringify(error)}`)
        } finally {
            setUploading(false)
        }
    }

    const handleRemovePhoto = async () => {
        try {
            setUploading(true)
            const { error } = await supabase
                .from("profiles")
                .update({ avatar_url: null, updated_at: new Date().toISOString() })
                .eq("id", user.id)

            if (error) throw error

            setAvatarUrl(null)
            setMessage("Profile picture removed.")
            router.refresh()
        } catch (error: any) {
            setMessage(`Error removing image: ${error.message}`)
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            const { error } = await supabase
                .from("profiles")
                .update({
                    first_name: firstName,
                    last_name: lastName,
                    username: username,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id)

            if (error) throw error
            setMessage("Profile updated successfully!")
            router.refresh()
        } catch (error: any) {
            setMessage(`Error updating profile: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12 relative">
            <div className="max-w-xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-secondary/50 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Edit Profile
                    </h1>
                </div>

                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-6 py-8 bg-secondary/20 rounded-2xl border border-border/50">
                    <div className="relative group">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Avatar"
                                className="h-32 w-32 rounded-full object-cover border-4 border-background shadow-xl"
                            />
                        ) : (
                            <div className="h-32 w-32 rounded-full bg-secondary flex items-center justify-center border-4 border-background shadow-xl">
                                <User className="h-12 w-12 text-muted-foreground" />
                            </div>
                        )}

                        <label className="absolute bottom-0 right-0 p-2.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-all shadow-lg transform group-hover:scale-105 active:scale-95 z-10">
                            <Camera className="h-5 w-5" />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onFileChange}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div className="flex gap-4">

                        <label className="text-sm font-medium text-primary hover:underline cursor-pointer">
                            Change Photo
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onFileChange}
                                disabled={uploading}
                                className="hidden"
                            />
                        </label>

                        {avatarUrl && (
                            <button
                                onClick={handleRemovePhoto}
                                className="text-sm font-medium text-destructive hover:underline flex items-center gap-1"
                            >
                                <Trash2 className="h-3 w-3" /> Remove
                            </button>
                        )}
                    </div>
                </div>

                {/* Crop Modal */}
                {showCropModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                        <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-semibold">Crop Image</h3>
                                <button onClick={() => setShowCropModal(false)}><X className="h-5 w-5" /></button>
                            </div>

                            <div className="relative h-64 bg-black w-full">
                                <Cropper
                                    image={imageSrc!}
                                    crop={crop}
                                    zoom={zoom}
                                    aspect={1}
                                    onCropChange={setCrop}
                                    onCropComplete={onCropComplete}
                                    onZoomChange={setZoom}
                                />
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-muted-foreground">Zoom</label>
                                    <input
                                        type="range"
                                        value={zoom}
                                        min={1}
                                        max={3}
                                        step={0.1}
                                        aria-labelledby="Zoom"
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCropModal(false)}
                                        className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUploadCroppedImage}
                                        disabled={uploading}
                                        className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex justify-center items-center gap-2"
                                    >
                                        {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                                        Set Profile Picture
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium ml-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-secondary/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/20 transition-all"
                            placeholder="@username"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full bg-secondary/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/20 transition-all"
                                placeholder="First Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium ml-1">Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                className="w-full bg-secondary/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/20 transition-all"
                                placeholder="Last Name"
                            />
                        </div>
                    </div>
                </div>

                {message && (
                    <div className="p-3 bg-secondary/50 rounded-lg text-sm text-center font-medium animate-in fade-in slide-in-from-bottom-2">
                        {message}
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={loading || uploading}
                    className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
