"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  ExternalLink,
  MessageCircle,
  Globe,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Send,
  PhoneIncoming,
  PhoneOutgoing,
  CalendarCheck,
  ArrowRightLeft,
  TrendingUp,
  Edit,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getCompany, updateCompanyStatus } from "@/lib/actions/companies";
import { getCompanyActivities } from "@/lib/actions/activity";
import {
  COMPANY_STATUSES,
  ACTIVITY_TYPES,
  FOLLOW_UP_CHANNELS,
  type CompanyStatus,
} from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/utils";

const statusColor: Record<CompanyStatus, string> = {
  prospect: "bg-slate-100 text-slate-700",
  contacted: "bg-blue-100 text-blue-700",
  in_call_queue: "bg-amber-100 text-amber-700",
  meeting_booked: "bg-purple-100 text-purple-700",
  opportunity: "bg-teal-100 text-teal-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
};

const activityIcon: Record<string, React.ElementType> = {
  note: FileText,
  whatsapp_sent: MessageCircle,
  linkedin_sent: ExternalLink,
  email_sent: Mail,
  call_made: PhoneOutgoing,
  call_received: PhoneIncoming,
  meeting_booked: Calendar,
  meeting_completed: CalendarCheck,
  status_changed: ArrowRightLeft,
  opportunity_created: TrendingUp,
  follow_up_scheduled: Clock,
  company_created: Building2,
  call_completed: PhoneOutgoing,
  outreach_sent: Send,
  follow_up_created: Clock,
  follow_up_completed: CheckCircle,
};

const activityColor: Record<string, string> = {
  note: "bg-slate-100 text-slate-500",
  whatsapp_sent: "bg-green-100 text-green-600",
  linkedin_sent: "bg-blue-100 text-blue-600",
  email_sent: "bg-slate-100 text-slate-600",
  call_made: "bg-amber-100 text-amber-600",
  call_received: "bg-green-100 text-green-600",
  meeting_booked: "bg-purple-100 text-purple-600",
  meeting_completed: "bg-emerald-100 text-emerald-600",
  status_changed: "bg-slate-100 text-slate-500",
  opportunity_created: "bg-teal-100 text-teal-600",
  follow_up_scheduled: "bg-blue-100 text-blue-600",
  company_created: "bg-teal-100 text-teal-600",
  call_completed: "bg-amber-100 text-amber-600",
  outreach_sent: "bg-green-100 text-green-600",
  follow_up_created: "bg-blue-100 text-blue-600",
  follow_up_completed: "bg-emerald-100 text-emerald-600",
};

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [company, setCompany] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getCompany(id);
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setCompany(result.data);
        setContacts(result.data.contacts || []);
        setActivities(result.data.activities || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    const result = await updateCompanyStatus(id, newStatus);
    if (result.data) {
      setCompany({ ...company, status: newStatus });
      const actResult = await getCompanyActivities(id);
      if (actResult.data) setActivities(actResult.data);
    }
    setStatusUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-teal-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading prospect...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-600 text-sm">{error || "Company not found"}</p>
          <Link href="/prospects">
            <Button variant="ghost" size="sm" className="mt-2">Back to Prospects</Button>
          </Link>
        </div>
      </div>
    );
  }

  const primaryContact = contacts.find(c => c.is_primary) || contacts[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/prospects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                {company.company_name}
              </h1>
              <Badge className={statusColor[company.status as CompanyStatus] || statusColor.prospect}>
                {COMPANY_STATUSES[company.status as CompanyStatus]?.label || company.status}
              </Badge>
            </div>
            <p className="text-slate-500 mt-1">
              {company.industry || "No industry"} &middot; {company.city && company.country ? `${company.city}, ${company.country}` : company.country || ""}
            </p>
          </div>
        </div>
        <Link href={`/prospects/${id}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-teal-600" />
                    Company Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Industry</p>
                      <p className="text-sm text-slate-700 mt-1">{company.industry || "—"}</p>
                    </div>
                    {company.website && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase">Website</p>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-teal-600 hover:underline mt-1 block"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}
                    {(company.city || company.country) && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase">Location</p>
                        <p className="text-sm text-slate-700 mt-1 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {[company.city, company.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    )}
                    {company.employee_count && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase">Employees</p>
                        <p className="text-sm text-slate-700 mt-1">{company.employee_count}</p>
                      </div>
                    )}
                    {company.phone && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
                        <p className="text-sm text-slate-700 mt-1">{company.phone}</p>
                      </div>
                    )}
                    {company.email && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
                        <p className="text-sm text-slate-700 mt-1">{company.email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase">Created</p>
                      <p className="text-sm text-slate-700 mt-1">{formatDate(company.created_at)}</p>
                    </div>
                  </div>
                  {company.notes && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-500 uppercase mb-1">Notes</p>
                      <p className="text-sm text-slate-700">{company.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-600" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                  />
                  <Button
                    size="sm"
                    className="mt-2 bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={() => setNewNote("")}
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Add Note
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {primaryContact && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-amber-600" />
                      Primary Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-base font-medium text-slate-900">{primaryContact.full_name}</p>
                      {primaryContact.title && (
                        <p className="text-sm text-slate-500">{primaryContact.title}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      {primaryContact.email && (
                        <a
                          href={`mailto:${primaryContact.email}`}
                          className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600"
                        >
                          <Mail className="h-4 w-4 text-slate-400" />
                          {primaryContact.email}
                        </a>
                      )}
                      {primaryContact.phone && (
                        <a
                          href={`tel:${primaryContact.phone}`}
                          className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600"
                        >
                          <Phone className="h-4 w-4 text-slate-400" />
                          {primaryContact.phone}
                        </a>
                      )}
                      {primaryContact.linkedin_url && (
                        <a
                          href={primaryContact.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"
                        >
                          <ExternalLink className="h-4 w-4 text-slate-400" />
                          LinkedIn Profile
                        </a>
                      )}
                      {primaryContact.whatsapp && (
                        <a
                          href={`https://wa.me/${primaryContact.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-slate-600 hover:text-green-600"
                        >
                          <MessageCircle className="h-4 w-4 text-slate-400" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {primaryContact?.whatsapp && (
                    <a
                      href={`https://wa.me/${primaryContact.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send WhatsApp
                      </Button>
                    </a>
                  )}
                  {primaryContact?.email && (
                    <a href={`mailto:${primaryContact.email}`}>
                      <Button className="w-full" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </a>
                  )}
                  {company.phone && (
                    <a href={`tel:${company.phone}`}>
                      <Button variant="outline" className="w-full" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Log Call
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(COMPANY_STATUSES).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      disabled={statusUpdating || company.status === key}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        company.status === key
                          ? "bg-teal-100 text-teal-700 ring-2 ring-teal-500"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {val.label}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
                <div className="space-y-6">
                  {activities.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No activities yet</p>
                    </div>
                  ) : (
                    activities.map((activity) => {
                      const Icon = activityIcon[activity.activity_type] || FileText;
                      const color = activityColor[activity.activity_type] || "bg-slate-100 text-slate-500";
                      return (
                        <div key={activity.id} className="flex gap-4 relative">
                          <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 pb-6">
                            <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                            {activity.description && (
                              <p className="text-sm text-slate-600 mt-0.5">{activity.description}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">{formatDateTime(activity.created_at)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
