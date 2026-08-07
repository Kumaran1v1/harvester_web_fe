import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Card, CardContent, Typography, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  CircularProgress, Divider, Avatar, Chip, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Paper
} from "@mui/material";
import {
  User, MapPin, Tractor, Phone, Mail, Edit, HardDrive, FileText,
  UploadCloud, Download, Eye, Trash2, Plus, Building2, Hash,
  FileCheck2, Shield, PhoneCall, GraduationCap, Camera
} from "lucide-react";
import { useDispatch } from "react-redux";
import { showToast } from "../../redux/toast/toastSlice";

interface OwnerDocument {
  id: number;
  title: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize?: string | null;
  fileType?: string | null;
  createdAt: string;
}

export const PersonalDetails: React.FC = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Profile State with In-Depth Fields
  const [profile, setProfile] = useState({
    name: "",
    companyName: "",
    mobile: "",
    secondaryMobile: "",
    email: "",
    education: "",
    machineName: "",
    machineModel: "",
    registrationNo: "",
    gstin: "",
    city: "",
    address: "",
    profileImage: ""
  });

  const [formData, setFormData] = useState({ ...profile });

  // Owner Documents Drive State
  const [documents, setDocuments] = useState<OwnerDocument[]>([]);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<OwnerDocument | null>(null);

  // Delete Modal State
  const [deleteDocId, setDeleteDocId] = useState<number | null>(null);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: "",
    category: "PERSONAL",
    fileUrl: "",
    fileName: "",
    fileSize: "",
    fileType: "pdf"
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile");
      if (!res.ok) throw new Error("Failed to load personal details");
      const data = await res.json();
      const loadedData = {
        name: data.name || "",
        companyName: data.companyName || "",
        mobile: data.mobile || "",
        secondaryMobile: data.secondaryMobile || "",
        email: data.email || "",
        education: data.education || "",
        machineName: data.machineName || "",
        machineModel: data.machineModel || "",
        registrationNo: data.registrationNo || "",
        gstin: data.gstin || "",
        city: data.city || "",
        address: data.address || "",
        profileImage: data.profileImage || ""
      };
      setProfile(loadedData);
      setFormData(loadedData);
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Could not fetch details", severity: "error" }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const loadDocuments = useCallback(async () => {
    setFetchingDocs(true);
    try {
      const res = await fetch("/api/auth/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setDocuments(data);
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Could not fetch documents", severity: "error" }));
    } finally {
      setFetchingDocs(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadProfile();
    loadDocuments();
  }, [loadProfile, loadDocuments]);

  // ── Profile Edit Handlers ──
  const handleOpenEdit = () => {
    setFormData({ ...profile });
    setIsEditOpen(true);
  };
  const handleCloseEdit = () => setIsEditOpen(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "mobile" || name === "secondaryMobile") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile)) {
      dispatch(showToast({ message: "Primary mobile number must be exactly 10 digits", severity: "error" }));
      return;
    }
    if (formData.secondaryMobile && !/^\d{10}$/.test(formData.secondaryMobile)) {
      dispatch(showToast({ message: "Secondary mobile number must be 10 digits", severity: "error" }));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile details");

      setProfile(formData);
      // Sync localStorage user
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...stored, ...formData }));

      dispatch(showToast({ message: "Personal and company details updated successfully!", severity: "success" }));
      handleCloseEdit();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error updating details", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      dispatch(showToast({ message: "Image size should be less than 5MB", severity: "warning" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result as string;
      setSaving(true);
      try {
        const res = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, profileImage: base64Image })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to upload profile picture");

        setProfile(prev => ({ ...prev, profileImage: base64Image }));
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({ ...stored, profileImage: base64Image }));
        window.dispatchEvent(new Event("profile-updated"));

        dispatch(showToast({ message: "Profile picture updated successfully!", severity: "success" }));
      } catch (err: any) {
        dispatch(showToast({ message: err.message || "Error uploading image", severity: "error" }));
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Document Upload Handlers ──
  const handleOpenUpload = () => {
    setUploadForm({
      title: "",
      category: "PERSONAL",
      fileUrl: "",
      fileName: "",
      fileSize: "",
      fileType: "pdf"
    });
    setIsUploadOpen(true);
  };
  const handleCloseUpload = () => setIsUploadOpen(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      dispatch(showToast({ message: "File size exceeds 25MB limit.", severity: "warning" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const sizeKb = (file.size / 1024).toFixed(0);
      const sizeStr = file.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`;
      const ext = file.name.split('.').pop()?.toLowerCase() || "pdf";

      setUploadForm(prev => ({
        ...prev,
        fileUrl: result,
        fileName: file.name,
        fileSize: sizeStr,
        fileType: ext,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.fileUrl) {
      dispatch(showToast({ message: "Please choose a document file to upload", severity: "warning" }));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to upload document");

      setDocuments(prev => [data, ...prev]);
      dispatch(showToast({ message: "Document saved to Drive successfully!", severity: "success" }));
      handleCloseUpload();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error uploading document", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  // ── Document Delete Handler ──
  const handleDeleteDoc = async () => {
    if (!deleteDocId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/auth/documents/${deleteDocId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document");

      setDocuments(prev => prev.filter(d => d.id !== deleteDocId));
      dispatch(showToast({ message: "Document deleted from Drive", severity: "success" }));
      setDeleteDocId(null);
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error deleting document", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  // Helper for Category Formatting
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "PERSONAL": return "Personal";
      case "MACHINARY": return "Machinary";
      case "RC_BOOK": return "RC Book";
      case "INSURANCE": return "Insurance Policy";
      case "PERMIT": return "Operating Permit";
      case "ID_PROOF": return "ID Proof (Aadhar/PAN)";
      case "TAX": return "Tax / Receipt";
      case "CONTRACT": return "Contract / Agreement";
      default: return "Other Document";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "PERSONAL": return "#3b82f6";
      case "MACHINARY": return "#0d9488";
      case "RC_BOOK": return "#0d9488";
      case "INSURANCE": return "#3b82f6";
      case "PERMIT": return "#f59e0b";
      case "ID_PROOF": return "#a855f7";
      case "TAX": return "#10b981";
      default: return "#64748b";
    }
  };

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    if (categoryFilter === "ALL") return documents;
    return documents.filter(d => d.category === categoryFilter);
  }, [documents, categoryFilter]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={44} color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 950, mx: "auto", pb: 5 }}>
      {/* Title */}
      <Box display="flex" justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 3, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, display: "flex", alignItems: "center", gap: 1.5, background: "linear-gradient(90deg, #2dd4bf, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
            <Building2 style={{ color: "#0d9488" }} />
            Owner & Company Portfolio
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            In-depth owner details, company registration, harvester machine info, and document drive vault.
          </Typography>
        </Box>
      </Box>

      {/* Main Owner & Company Portfolio Card */}
      <Card sx={{ position: "relative", overflow: "hidden", borderRadius: 3.5, border: "1px solid rgba(13, 148, 136, 0.2)", mb: 4, bgcolor: "background.paper", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
        <Box sx={{ height: 6, background: "linear-gradient(90deg, #0d9488, #2dd4bf, #818cf8)" }} />
        <CardContent sx={{ p: { xs: 2.2, sm: 4 } }}>
          {/* Header row with Company Name, Owner Name and Edit Button */}
          <Box display="flex" justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 3, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              {/* Profile Image Avatar with Interactive Camera Upload Badge */}
              <Box sx={{ position: "relative" }}>
                <Avatar
                  src={profile.profileImage || undefined}
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: "rgba(13, 148, 136, 0.15)",
                    color: "#2dd4bf",
                    fontWeight: 900,
                    fontSize: "1.5rem",
                    border: "3px solid #0d9488",
                    boxShadow: "0 4px 14px rgba(13, 148, 136, 0.3)"
                  }}
                >
                  {!profile.profileImage && (
                    profile.companyName ? profile.companyName.charAt(0).toUpperCase() : profile.name ? profile.name.charAt(0).toUpperCase() : "C"
                  )}
                </Avatar>
                <Tooltip title="Upload Profile Picture" arrow placement="top">
                  <IconButton
                    component="label"
                    size="small"
                    sx={{
                      position: "absolute",
                      bottom: -4,
                      right: -4,
                      bgcolor: "primary.main",
                      color: "#fff",
                      p: 0.5,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                      "&:hover": { bgcolor: "primary.dark" }
                    }}
                  >
                    <Camera size={14} />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                    />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900} sx={{ color: "text.primary", fontSize: { xs: "1.15rem", sm: "1.3rem" } }}>
                  {profile.companyName || "Company Name Not Set"}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                  <User size={14} style={{ color: "#2dd4bf" }} /> Owner: {profile.name || "Owner Name"}
                </Typography>
              </Box>
            </Box>

            <Button variant="outlined" color="primary" startIcon={<Edit size={16} />} onClick={handleOpenEdit} sx={{ fontWeight: 800, borderRadius: 2, width: { xs: "100%", sm: "auto" } }}>
              Edit Portfolio Details
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* In-Depth Fields Grid */}
          <Grid container spacing={3}>
            {/* Company / Business Name */}
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Building2 size={18} style={{ color: "#0d9488" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Company / Business Name</Typography>
                  <Typography variant="body1" fontWeight={800}>{profile.companyName || "N/A"}</Typography>
                </Box>
              </Box>
            </Grid>

            {/* Owner Name */}
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <User size={18} style={{ color: "#0d9488" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Owner Name</Typography>
                  <Typography variant="body1" fontWeight={800}>{profile.name || "N/A"}</Typography>
                </Box>
              </Box>
            </Grid>

            {/* Primary Mobile */}
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Phone size={18} style={{ color: "#0d9488" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Primary Mobile Number</Typography>
                  <Typography variant="body1" fontWeight={800}>{profile.mobile || "N/A"}</Typography>
                </Box>
              </Box>
            </Grid>

            {/* Secondary Mobile */}
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <PhoneCall size={18} style={{ color: "#0d9488" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Alternate / Emergency Contact</Typography>
                  <Typography variant="body1" fontWeight={800}>{profile.secondaryMobile || "N/A"}</Typography>
                </Box>
              </Box>
            </Grid>

            {/* Email Address */}
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Mail size={18} style={{ color: "#0d9488" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Email Address</Typography>
                  <Typography variant="body1" fontWeight={800} sx={{ wordBreak: "break-all" }}>{profile.email || "N/A"}</Typography>
                </Box>
              </Box>
            </Grid>

            {/* Education / Qualification */}
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <GraduationCap size={18} style={{ color: "#0d9488" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Owner Qualification / Education</Typography>
                  <Typography variant="body1" fontWeight={800}>{profile.education || "N/A"}</Typography>
                </Box>
              </Box>
            </Grid>

            {/* City / Location */}
            <Grid item xs={12} sm={6} md={4}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <MapPin size={18} style={{ color: "#0d9488" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">City / Region</Typography>
                  <Typography variant="body1" fontWeight={800}>{profile.city || "N/A"}</Typography>
                </Box>
              </Box>
            </Grid>

            {/* Business Address */}
            <Grid item xs={12} sm={8}>
              <Box display="flex" alignItems="flex-start" gap={1.5}>
                <MapPin size={18} style={{ color: "#0d9488", marginTop: 2 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Full Business Address</Typography>
                  <Typography variant="body1" fontWeight={800} sx={{ whiteSpace: "pre-line" }}>
                    {profile.address || "No Address Provided"}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── OWNER DOCUMENT DRIVE VAULT SECTION ── */}
      <Box sx={{ mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: "wrap", gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1.5 }}>
            <HardDrive style={{ color: "#2dd4bf" }} />
            Owner Document Drive Vault ({documents.length})
          </Typography>

          {/* Filter Chips & Upload Button Row */}
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            {/* Filter Chips */}
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip
                label={`Over All (${documents.length})`}
                color={categoryFilter === "ALL" ? "primary" : "default"}
                size="small"
                onClick={() => setCategoryFilter("ALL")}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label="Personal"
                color={categoryFilter === "PERSONAL" ? "primary" : "default"}
                size="small"
                onClick={() => setCategoryFilter("PERSONAL")}
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label="Machinary"
                color={categoryFilter === "MACHINARY" ? "primary" : "default"}
                size="small"
                onClick={() => setCategoryFilter("MACHINARY")}
                sx={{ fontWeight: 700 }}
              />
            </Box>

            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<Plus size={16} />}
              onClick={handleOpenUpload}
              sx={{ fontWeight: 800, px: 2, py: 0.5, borderRadius: 2.5, textTransform: "none" }}
            >
              Upload Document
            </Button>
          </Box>
        </Box>

        {fetchingDocs ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : filteredDocs.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3, border: "1px dashed rgba(255,255,255,0.15)", bgcolor: "background.paper" }}>
            <UploadCloud size={40} style={{ color: "#94a3b8", opacity: 0.5, marginBottom: 8 }} />
            <Typography variant="body1" sx={{ fontWeight: 700, mb: 0.5 }}>
              No documents stored in Drive
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Upload your Personal details or Machinery documents for safe cloud storage.
            </Typography>
            <Button variant="outlined" color="primary" size="small" startIcon={<Plus size={16} />} onClick={handleOpenUpload} sx={{ fontWeight: 700 }}>
              Upload First Document
            </Button>
          </Paper>
        ) : (
          /* Document Grid */
          <Grid container spacing={2}>
            {filteredDocs.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
                <Card sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)", bgcolor: "background.paper", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", transition: "transform 0.2s", "&:hover": { transform: "translateY(-2px)" } }}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: "rgba(13, 148, 136, 0.12)", color: "#2dd4bf", width: 42, height: 42 }}>
                        <FileText size={22} />
                      </Avatar>
                      <Chip
                        label={getCategoryLabel(doc.category)}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: "10px", bgcolor: `${getCategoryColor(doc.category)}20`, color: getCategoryColor(doc.category), border: `1px solid ${getCategoryColor(doc.category)}40` }}
                      />
                    </Box>

                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, lineClamp: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {doc.title}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                      {doc.fileName} • {doc.fileSize || "PDF"}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ pt: 1.5, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "11px" }}>
                      {new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </Typography>

                    <Box display="flex" gap={0.5}>
                      <Tooltip title="View Document" arrow>
                        <IconButton size="small" color="primary" onClick={() => setPreviewDoc(doc)}>
                          <Eye size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download Document" arrow>
                        <IconButton
                          size="small"
                          color="success"
                          component="a"
                          href={doc.fileUrl}
                          download={doc.fileName}
                        >
                          <Download size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Document" arrow>
                        <IconButton size="small" color="error" onClick={() => setDeleteDocId(doc.id)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* In-Depth Edit Profile Dialog Modal */}
      <Dialog open={isEditOpen} onClose={handleCloseEdit} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Owner & Company Portfolio</DialogTitle>
        <form onSubmit={handleProfileSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company / Business Name"
                  name="companyName"
                  fullWidth
                  placeholder="e.g. Gunal Harvester Services"
                  value={formData.companyName}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Owner Name"
                  name="name"
                  fullWidth
                  placeholder="Owner full name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Primary Mobile Number"
                  name="mobile"
                  fullWidth
                  placeholder="10-digit mobile number"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  inputProps={{ maxLength: 10, inputMode: "numeric" }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Alternate / Emergency Mobile"
                  name="secondaryMobile"
                  fullWidth
                  placeholder="10-digit alternate mobile"
                  value={formData.secondaryMobile}
                  onChange={handleInputChange}
                  inputProps={{ maxLength: 10, inputMode: "numeric" }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  name="email"
                  type="email"
                  fullWidth
                  placeholder="e.g. owner@harvester.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Owner Education / Qualification"
                  name="education"
                  fullWidth
                  placeholder="e.g. B.E / Agricultural Studies"
                  value={formData.education}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="City / Region"
                  name="city"
                  fullWidth
                  placeholder="e.g. Coimbatore"
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Business Address"
                  name="address"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Enter full business address..."
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseEdit} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? "Saving..." : "Save Portfolio"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Upload Document Dialog Modal */}
      <Dialog open={isUploadOpen} onClose={handleCloseUpload} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Upload Document to Drive</DialogTitle>
        <form onSubmit={handleUploadSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Document Title"
                  fullWidth
                  required
                  placeholder="e.g. Harvester RC Book 2026"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required size="small">
                  <InputLabel>Document Category</InputLabel>
                  <Select
                    value={uploadForm.category}
                    label="Document Category"
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <MenuItem value="PERSONAL">Personal</MenuItem>
                    <MenuItem value="MACHINARY">Machinary</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 2.5, border: "2px dashed rgba(13, 148, 136, 0.4)", borderRadius: 2, textCenter: "center", bgcolor: "rgba(13, 148, 136, 0.05)", textAlign: "center" }}>
                  <UploadCloud size={32} style={{ color: "#0d9488", marginBottom: 8 }} />
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                    {uploadForm.fileName ? uploadForm.fileName : "Select Document File"}
                  </Typography>
                  {uploadForm.fileSize && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      File Size: {uploadForm.fileSize}
                    </Typography>
                  )}
                  <Button variant="outlined" component="label" size="small" sx={{ fontWeight: 700 }}>
                    Browse File
                    <input type="file" hidden accept="image/*,application/pdf,.doc,.docx" onChange={handleFileSelect} />
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseUpload} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving || !uploadForm.fileUrl}>
              {saving ? "Uploading..." : "Save to Drive"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Preview Document Modal */}
      <Dialog open={!!previewDoc} onClose={() => setPreviewDoc(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 800, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{previewDoc?.title}</span>
          <Chip label={previewDoc ? getCategoryLabel(previewDoc.category) : ""} size="small" color="primary" />
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2, height: "70vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {previewDoc?.fileUrl.startsWith("data:image/") ? (
            <img src={previewDoc.fileUrl} alt={previewDoc.title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8 }} />
          ) : (
            <iframe src={previewDoc?.fileUrl} title={previewDoc?.title} style={{ width: "100%", height: "100%", border: "none", borderRadius: 8 }} />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<Download size={16} />}
            component="a"
            href={previewDoc?.fileUrl}
            download={previewDoc?.fileName}
          >
            Download
          </Button>
          <Button onClick={() => setPreviewDoc(null)} color="inherit">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteDocId} onClose={() => setDeleteDocId(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>Delete Document</DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Typography variant="body1">
            Are you sure you want to delete this document from your Drive Vault? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteDocId(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteDoc} variant="contained" color="error" disabled={saving}>
            {saving ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PersonalDetails;
