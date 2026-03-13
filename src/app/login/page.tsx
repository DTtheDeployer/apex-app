const result = await login(formData)

if (result?.error) {
  setError(result.error)
  setLoading(false)
  return
}

// Redirect on success
window.location.href = '/dashboard'