const handleEndSession = async (session) => {
    if (!session) return
    try {
        await session.abortTransaction() // abort first
    } catch (err) {
        if (err.message.includes("Cannot call abortTransaction twice")) {
            console.warn("Transaction was already aborted.")
        } else {
            console.error("Error aborting transaction:", err)
        }
    } finally {
        session.endSession() // always end the session
    }
}

const handleSuccessSession = async (session) => {
    if (!session) return
    try {
        console.log('COMMITTING TX', { sessionId: session?.clientSession?.id || session?.id || 'no-session', time: Date.now() })
        await session.commitTransaction() 
        // after commit: 
        console.log('COMMIT DONE', { ok: true, sessionId: session?.clientSession?.id || session?.id || 'no-session' })
    } catch (err) {
        console.error("Error Commiting Transaction:", err)
    } finally {
        session.endSession() // always end the session
    }
}

const createError = (message, statusCode = 400) => {
    const error = new Error(message)
    error.statusCode = statusCode
    return error
}

module.exports = { handleEndSession, handleSuccessSession, createError }