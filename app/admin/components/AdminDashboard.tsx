'use client'

import { useState, useTransition } from 'react'
import type { Listing, Submission } from '@/lib/types'
import { CATEGORY_LABELS, PRICING_LABELS } from '@/lib/constants'
import {
  updateListingStatus,
  toggleListingFeatured,
  deleteListing,
  approveSubmission,
  rejectSubmission,
} from '../actions'

type Tab = 'listings' | 'submissions'

export function AdminDashboard({
  listings,
  submissions,
}: {
  listings: Listing[]
  submissions: Submission[]
}) {
  const [tab, setTab] = useState<Tab>('listings')
  const pendingCount = submissions.filter((s) => s.status === 'pending').length

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-8 w-fit">
        <button
          onClick={() => setTab('listings')}
          className={`px-4 py-2 rounded-md text-sm font-sans font-medium transition-colors ${
            tab === 'listings' ? 'bg-white text-navy shadow-sm' : 'text-charcoal/50 hover:text-charcoal'
          }`}
        >
          Listings ({listings.length})
        </button>
        <button
          onClick={() => setTab('submissions')}
          className={`px-4 py-2 rounded-md text-sm font-sans font-medium transition-colors ${
            tab === 'submissions' ? 'bg-white text-navy shadow-sm' : 'text-charcoal/50 hover:text-charcoal'
          }`}
        >
          Submissions {pendingCount > 0 && <span className="ml-1 bg-gold-text text-white text-xs rounded-full px-1.5 py-0.5">{pendingCount}</span>}
        </button>
      </div>

      {tab === 'listings' ? (
        <ListingsTable listings={listings} />
      ) : (
        <SubmissionsTable submissions={submissions} />
      )}
    </div>
  )
}

function ListingsTable({ listings }: { listings: Listing[] }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-2 font-sans font-semibold text-charcoal/50 text-xs uppercase tracking-wider">Name</th>
            <th className="text-left py-3 px-2 font-sans font-semibold text-charcoal/50 text-xs uppercase tracking-wider">Category</th>
            <th className="text-left py-3 px-2 font-sans font-semibold text-charcoal/50 text-xs uppercase tracking-wider">Pricing</th>
            <th className="text-left py-3 px-2 font-sans font-semibold text-charcoal/50 text-xs uppercase tracking-wider">Status</th>
            <th className="text-center py-3 px-2 font-sans font-semibold text-charcoal/50 text-xs uppercase tracking-wider">Featured</th>
            <th className="text-center py-3 px-2 font-sans font-semibold text-charcoal/50 text-xs uppercase tracking-wider">Verified</th>
            <th className="text-right py-3 px-2 font-sans font-semibold text-charcoal/50 text-xs uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className={isPending ? 'opacity-50' : ''}>
          {listings.map((listing) => (
            <tr key={listing.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-3 px-2">
                <p className="font-sans font-medium text-navy">{listing.name}</p>
                <p className="text-xs text-charcoal/40 mt-0.5">{listing.slug}</p>
              </td>
              <td className="py-3 px-2">
                <span className="text-xs bg-slate-100 text-charcoal rounded-full px-2 py-0.5">
                  {CATEGORY_LABELS[listing.category] ?? listing.category}
                </span>
              </td>
              <td className="py-3 px-2 text-charcoal/60">
                {PRICING_LABELS[listing.pricing_model] ?? listing.pricing_model}
              </td>
              <td className="py-3 px-2">
                <select
                  value={listing.status}
                  onChange={(e) =>
                    startTransition(() =>
                      updateListingStatus(listing.id, e.target.value as Listing['status'])
                    )
                  }
                  className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                >
                  <option value="published">Published</option>
                  <option value="pending_review">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </td>
              <td className="py-3 px-2 text-center">
                <input
                  type="checkbox"
                  checked={listing.featured}
                  onChange={(e) =>
                    startTransition(() => toggleListingFeatured(listing.id, e.target.checked))
                  }
                  className="accent-navy"
                />
              </td>
              {/* Read-only: verification is earned by the link check, not
                  granted here. See the note in admin/actions.ts. */}
              <td className="py-3 px-2 text-center">
                {listing.verified && listing.verified_at ? (
                  <span
                    className="text-xs text-green-700"
                    title={`Auto-verified ${new Date(listing.verified_at).toISOString().slice(0, 10)}`}
                  >
                    {new Date(listing.verified_at).toISOString().slice(0, 10)}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400" title="Not confirmed by the last link check">
                    —
                  </span>
                )}
              </td>
              <td className="py-3 px-2 text-right">
                <button
                  onClick={() => {
                    if (confirm(`Delete "${listing.name}"?`)) {
                      startTransition(() => deleteListing(listing.id))
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-sans"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SubmissionsTable({ submissions }: { submissions: Submission[] }) {
  const [isPending, startTransition] = useTransition()

  if (submissions.length === 0) {
    return (
      <p className="text-charcoal/50 font-body text-center py-12">
        No submissions yet.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((sub) => {
        const data = sub.listing_data as Record<string, string>
        return (
          <div key={sub.id} className={`card-bordered ${isPending ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-sans font-semibold text-navy">{data.name || 'Untitled'}</p>
                <p className="text-sm text-charcoal/60 font-body mt-1">{data.tagline || ''}</p>
                <div className="flex gap-3 mt-2 text-xs text-charcoal/40 font-body">
                  <span>From: {sub.submitter_name} ({sub.submitter_email})</span>
                  <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                </div>
                {data.description && (
                  <p className="text-sm text-charcoal/50 font-body mt-3 line-clamp-3">
                    {data.description}
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {sub.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => startTransition(() => approveSubmission(sub.id))}
                      className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded font-sans font-medium transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => startTransition(() => rejectSubmission(sub.id))}
                      className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded font-sans font-medium transition-colors"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <span
                    className={`text-xs rounded-full px-2.5 py-1 font-sans ${
                      sub.status === 'approved'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {sub.status}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
