/**
 * CourierForm Page
 * Form for creating and editing couriers
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCourier, createCourier, updateCourier } from '@/services/courierService';
import type { CourierCreate } from '@/types/courier';

export default function CourierForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CourierCreate>({
    name: '',
    phone: '',
  });
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  // Fetch courier data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchCourier(id);
    }
  }, [isEditMode, id]);

  const fetchCourier = async (courierId: string) => {
    try {
      setLoading(true);
      const data = await getCourier(courierId);
      setFormData({
        name: data.name,
        phone: data.phone,
      });
    } catch (error: any) {
      toast.error('Gagal memuat data kurir', {
        description: error.response?.data?.detail || 'Terjadi kesalahan',
      });
      navigate('/couriers');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string; phone?: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama kurir wajib diisi';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nama kurir minimal 2 karakter';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Nama kurir maksimal 100 karakter';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Format nomor telepon tidak valid';
    } else if (formData.phone.replace(/[^0-9]/g, '').length < 9) {
      newErrors.phone = 'Nomor telepon minimal 9 digit';
    } else if (formData.phone.length > 20) {
      newErrors.phone = 'Nomor telepon maksimal 20 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      if (isEditMode && id) {
        await updateCourier(id, formData);
        toast.success('Kurir berhasil diperbarui');
      } else {
        await createCourier(formData);
        toast.success('Kurir berhasil ditambahkan');
      }

      navigate('/couriers');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Terjadi kesalahan';
      
      // Check if it's a duplicate phone error
      if (errorMessage.toLowerCase().includes('already exists') || 
          errorMessage.toLowerCase().includes('sudah ada')) {
        toast.error('Nomor telepon sudah terdaftar', {
          description: 'Silakan gunakan nomor telepon yang lain',
        });
      } else {
        toast.error(
          isEditMode ? 'Gagal memperbarui kurir' : 'Gagal menambahkan kurir',
          { description: errorMessage }
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof CourierCreate, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-lg">Memuat data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/couriers')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Edit Pengantar' : 'Tambah Pengantar'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? 'Perbarui data pengantar/kurir' : 'Tambah pengantar/kurir baru'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pengantar</CardTitle>
          <CardDescription>
            Isi form di bawah ini untuk {isEditMode ? 'memperbarui' : 'menambahkan'} data pengantar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="required">
                Nama Lengkap
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Contoh: Ahmad Ridwan"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={errors.name ? 'border-destructive' : ''}
                maxLength={100}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="required">
                Nomor Telepon
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Contoh: 081234567890"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={errors.phone ? 'border-destructive' : ''}
                maxLength={20}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Format: 08123456789 atau +628123456789
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/couriers')}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Tambah Pengantar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
