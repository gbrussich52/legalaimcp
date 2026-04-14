import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { supabase } from '@/lib/supabase'
import type { Listing, Submission } from '@/lib/types'
import { AdminDashboard } from './components/AdminDashboard'

export const metadata = { title: 'Admin Dashboard', robots: { index: false } }

export default async function AdminPage() {
  const authed = await isAdminAuthenticated()
  if (!authed) redirect('/admin/login')

  let listings: Listing[] = []
  let submissions: Submission[] = []
  let stats = { published: 0, pending: 0, rejected: 0 }

  if (supabase) {
    const [listingsRes, submissionsRes] = await Promise.all([
      supabase.from('listings').select('*').order('featured', { ascending: false }).order('name'),
      supabase.from('submissions').select('*').order('created_at', { ascending: false }),
    ])
    listings = (listingsRes.data ?? []) as Listing[]
    submissions = (submissionsRes.data ?? []) as Submission[]

    stats.published = listings.filter((l) => l.status === 'published').length
    stats.pending = submissions.filter((s) => s.status === 'pending').length
    stats.rejected = submissions.filter((s) => s.status === 'rejected').length
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
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

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="card-bordered text-center py-6">
          <p className="font-display text-3xl font-bold text-navy">{stats.published}</p>
          <p className="text-sm text-charcoal/50 font-sans mt-1">Published Listings</p>
        </div>
        <div className="card-bordered text-center py-6">
          <p className="font-display text-3xl font-bold text-gold-text">{stats.pending}</p>
          <p className="text-sm text-charcoal/50 font-sans mt-1">Pending Submissions</p>
        </div>
        <div className="card-bordered text-center py-6">
          <p className="font-display text-3xl font-bold text-charcoal/40">{stats.rejected}</p>
          <p className="text-sm text-charcoal/50 font-sans mt-1">Rejected</p>
        </div>
      </div>

      <AdminDashboard listings={listings} submissions={submissions} />
    </main>
  )
}
