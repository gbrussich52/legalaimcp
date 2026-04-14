import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getAdminClient } from '@/lib/supabase-admin'
import type { Listing, Submission } from '@/lib/types'
import { AdminDashboard } from './components/AdminDashboard'

export const metadata = { title: 'Admin Dashboard', robots: { index: false } }

export default async function AdminPage() {
  const authed = await isAdminAuthenticated()
  if (!authed) redirect('/admin/login')

  let listings: Listing[] = []
  let submissions: Submission[] = []
  let error: string | null = null

  try {
    const db = getAdminClient()
    const [listingsRes, submissionsRes] = await Promise.all([
      db.from('listings').select('*').order('featured', { ascending: false }).order('name'),
      db.from('submissions').select('*').order('created_at', { ascending: false }),
    ])

    if (listingsRes.error) throw new Error(listingsRes.error.message)
    if (submissionsRes.error) throw new Error(submissionsRes.error.message)

    listings = listingsRes.data as Listing[]
    submissions = submissionsRes.data as Submission[]
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load data'
  }

  const published = listings.filter((l) => l.status === 'published').length
  const pendingSubs = submissions.filter((s) => s.status === 'pending').length

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Admin Dashboard</h1>
          <p className="font-body text-charcoal/60 mt-1">Manage listings and review submissions</p>
        </div>
        <form action="/admin/logout" method="POST">
          <button className="text-sm text-charcoal/50 hover:text-charcoal font-sans transition-colors">
            Sign Out
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-red-700 font-body">
            <strong>Error:</strong> {error}
          </p>
          <p className="text-xs text-red-500 font-body mt-1">
            Check that SUPABASE_SERVICE_ROLE_KEY is set in your environment variables.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="card-bordered text-center py-6">
          <p className="font-display text-3xl font-bold text-navy">{published}</p>
          <p className="text-sm text-charcoal/50 font-sans mt-1">Published Listings</p>
        </div>
        <div className="card-bordered text-center py-6">
          <p className="font-display text-3xl font-bold text-gold-text">{pendingSubs}</p>
          <p className="text-sm text-charcoal/50 font-sans mt-1">Pending Submissions</p>
        </div>
        <div className="card-bordered text-center py-6">
          <p className="font-display text-3xl font-bold text-charcoal/40">{listings.length}</p>
          <p className="text-sm text-charcoal/50 font-sans mt-1">Total Listings (all statuses)</p>
        </div>
      </div>

      <AdminDashboard listings={listings} submissions={submissions} />
    </section>
  )
}
