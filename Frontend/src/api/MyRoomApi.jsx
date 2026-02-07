import { useMutation } from "react-query"
import { useToast } from "../contexts/ToastContext"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const useCreateMyRoom = () => {
    const { addToast } = useToast()

    const createMyRoomRequest = async (roomDetails) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/my/room/create`, {
                method: 'POST',
                credentials: 'include',
                body: roomDetails
            })

            if (!response.ok) {
                // const error = await response.json()
                throw new Error()
            }

            const data = await response.json()
            if (data.success) {
                addToast("success", data.success)
                return data
            } 
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: createMyRoom, isLoading: isMyRoomCreating  } = useMutation(createMyRoomRequest)
    
    return {
        createMyRoom,
        isMyRoomCreating
    }
}

export const useEditMyRoomNamePhotoTheme = () => {
    const { addToast } = useToast()

    const editMyRoomNamePhotoThemeRequest = async (payload) => {
        try {
            if (!payload.roomId) {
                throw new Error("Cannot get Room")
            }

            const response = await fetch(`${API_BASE_URL}/api/my/room/${payload.roomId}/editNamePhotoTheme`, {
                method: 'PATCH',
                credentials: 'include',
                body: payload.formData
            })

            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                throw new Error(error.error)
            }

            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: editNameAndCo, isLoading: isEditNameAndCoLoading } = useMutation(editMyRoomNamePhotoThemeRequest)

    return {
        editNameAndCo,
        isEditNameAndCoLoading
    }
}

export const usePatchEditMyRoomCoverPic = () => {
    const { addToast } = useToast()

    const patchEditMyRoomCoverPicRequest = async (payload) => {
        try {
            if (!payload.roomId) {
                throw new Error("Cannot get Room")
            }

            const response = await fetch(`${API_BASE_URL}/api/my/room/${payload.roomId}/edit/profile-picture`, {
                method: "PATCH",
                credentials: 'include',
                body: payload.formData
            })
    
            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                throw new Error(error.error)
            }
            
            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: patchEditRoomCoverPic, isLoading } = useMutation(patchEditMyRoomCoverPicRequest)

    return { patchEditRoomCoverPic, isLoading }
}

export const useKickMyParticipant = () => {
    const { addToast } = useToast()

    const kickMyParticipantRequest = async (payload) => {
        try {
            if (!payload.roomId) {
                throw new Error("Cannot get Room")
            }

            const response = await fetch(`${API_BASE_URL}/api/my/room/${payload.roomId}/kick-participant`, {
                method: "PATCH",
                credentials: 'include',
                headers: {'Content-Type': "application/json"},
                body: JSON.stringify(payload.participantDetails)
            })
    
            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                throw new Error(error.error)
            }
            
            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: kickMyParticipant, isLoading: isKickMyParticipantLoading } = useMutation(kickMyParticipantRequest)
    
    return {
        kickMyParticipant,
        isKickMyParticipantLoading
    }
}

export const useChangeRoomVideo = () => {
    const { addToast } = useToast()

    const changeMyRoomVideoRequest = async (payload) => {
        try {
            if (!payload.roomId) {
                throw new Error("Cannot get Room")
            }

            const response = await fetch(`${API_BASE_URL}/api/my/room/${payload.roomId}/change-video`, {
                method: "PATCH",
                credentials: 'include',
                headers: {'Content-Type': "application/json"},
                body: JSON.stringify(payload.videoId)
            })
    
            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                throw new Error(error.error)
            }
            
            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: changeRoomVideo, isLoading: isChangeRoomVideoLoading } = useMutation(changeMyRoomVideoRequest)

    return {
        changeRoomVideo,
        isChangeRoomVideoLoading
    }
}

export const useInviteUser = () => {
    const { addToast } = useToast()

    const inviteUserRequest = async (payload) => {
        try {
            if (!payload.roomId) {
                throw new Error("Cannot get Room")
            }

            const response = await fetch(`${API_BASE_URL}/api/my/room/${payload.roomId}/invite-user`, {
                method: "POST",
                credentials: 'include',
                headers: {'Content-Type': "application/json"},
                body: JSON.stringify(payload.invitedUser)
            })
    
            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                throw new Error(error.error)
            }
            
            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: inviteUser, isLoading: isInviteUserLoading } = useMutation(inviteUserRequest)

    return {
        inviteUser,
        isInviteUserLoading
    }
}

export const useRejectInvite = () => {
    const { addToast } = useToast()

    const rejectInviteRequest = async (roomId) => {
        try {
            if (!roomId) {
                throw new Error("Cannot get Room")
            }

            const response = await fetch(`${API_BASE_URL}/api/my/room/${roomId}/reject-invite`, {
                method: "PATCH",
                credentials: 'include',
                headers: {'Content-Type': "application/json"}
            })
    
            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                throw new Error(error.error)
            }
            
            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: rejectInvite, isLoading: isRejectInviteLoading } = useMutation(rejectInviteRequest)

    return {
        rejectInvite,
        isRejectInviteLoading
    }
}

export const usePromoteToAdmin = () => {
    const { addToast } = useToast()

    const promoteToAdminRequest = async (payload) => {
        try {
            if (!payload.roomId) {
                throw new Error("Cannot get Room")
            }

            const response = await fetch(`${API_BASE_URL}/api/my/room/${payload.roomId}/promote-to-admin`, {
                method: "PATCH",
                credentials: 'include',
                headers: {'Content-Type': "application/json"},
                body: JSON.stringify(payload.participantDetails)
            })
    
            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                throw new Error(error.error)
            }
            
            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: promoteToAdmin, isLoading: isPromoteToAdminLoading } = useMutation(promoteToAdminRequest)
    
    return {
        promoteToAdmin,
        isPromoteToAdminLoading
    }
}

export const useDemoteMyAdmin = () => {
    const { addToast } = useToast()

    const demoteMyAdminRequest = async (payload) => {
        try {
            if (!payload.roomId) {
                throw new Error("Cannot get Room")
            }

            const response = await fetch(`${API_BASE_URL}/api/my/room/${payload.roomId}/demote-my-admin`, {
                method: "PATCH",
                credentials: 'include',
                headers: {'Content-Type': "application/json"},
                body: JSON.stringify(payload.participantDetails)
            })
    
            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                throw new Error(error.error)
            }
            
            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: demoteMyAdmin, isLoading: isDemoteMyAdminLoading } = useMutation(demoteMyAdminRequest)
    
    return {
        demoteMyAdmin,
        isDemoteMyAdminLoading
    }
}

export const useSaveRoom = () => {
    const { addToast } = useToast()

    const saveRoomRequest = async (roomId) => {
        try {
            if (!roomId) {
                throw new Error("Cannot get Room")
            }

            const response = await fetch(`${API_BASE_URL}/api/my/room/${roomId}/save`, {
                method: 'PATCH',
                credentials: 'include'
            })

            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                return error
            }

            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: saveRoom, isLoading: isSaveRoomLoading } = useMutation(saveRoomRequest)

    return {
        saveRoom,
        isSaveRoomLoading
    }
}

export const useLikeRoom = () => {
    const { addToast } = useToast()

    const likeRoomRequest = async (roomId) => {
        try {
            if (!roomId) {
                throw new Error("Cannot get Room")
            }

            const response = await fetch(`${API_BASE_URL}/api/my/room/${roomId}/like`, {
                method: 'PATCH',
                credentials: 'include'
            })

            if (!response.ok) {
                const error = await response.json()
                console.log(error)
                return error
            }

            const data = await response.json()
            return data
        } catch (err) {
            addToast("error", (err.message === "Failed to fetch" ? "Network Error" : err.message))
        }
    }

    const { mutateAsync: likeRoom, isLoading: isLikeRoomLoading } = useMutation(likeRoomRequest)

    return {
        likeRoom,
        isLikeRoomLoading
    }
}