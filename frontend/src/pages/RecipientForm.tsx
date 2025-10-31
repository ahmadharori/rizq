/**
 * RecipientForm Page
 * Form for creating and editing recipients with Google Maps integration
 */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { recipientService } from '@/services/recipientService';
import { regionService } from '@/services/regionService';
import { LocationPicker } from '@/components/maps/LocationPicker';
import type { RecipientBase, Location } from '@/types/recipient';
import type { Province, City } from '@/types/region';

interface RecipientFormData {
  name: string;
  phone: string;
  address: string;
  province_id: string;
  city_id: string;
  location: Location;
  num_packages: string;
}

export default function RecipientForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<RecipientFormData>({
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      province_id: '',
      city_id: '',
      location: { lat: 0, lng: 0 },
      num_packages: '1',
    },
  });

  // Watch province changes
  const provinceId = watch('province_id');

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await regionService.getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error('Error loading provinces:', error);
        toast.error('Gagal memuat data provinsi');
      }
    };
    loadProvinces();
  }, []);

  // Load cities when province changes
  useEffect(() => {
    const loadCities = async () => {
      if (!provinceId) {
        setCities([]);
        return;
      }

      try {
        const data = await regionService.getCities(provinceId);
        setCities(data);
      } catch (error) {
        console.error('Error loading cities:', error);
        toast.error('Gagal memuat data kab/kota');
        setCities([]);
      }
    };

    loadCities();

    // Clear city selection when province changes
    if (provinceId !== selectedProvinceId) {
      setValue('city_id', '');
      setSelectedProvinceId(provinceId);
    }
  }, [provinceId, selectedProvinceId, setValue]);

  // Fetch recipient data in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchRecipient(id);
    }
  }, [isEditMode, id]);

  const fetchRecipient = async (recipientId: string) => {
    try {
      setLoading(true);
      const data = await recipientService.getById(recipientId);
      
      reset({
        name: data.name,
        phone: data.phone,
        address: data.address,
        province_id: data.province_id.toString(),
        city_id: data.city_id.toString(),
        location: data.location,
        num_packages: data.num_packages.toString(),
      });
      
      setSelectedProvinceId(data.province_id.toString());
    } catch (error: any) {
      toast.error('Gagal memuat data penerima', {
        description: error.response?.data?.detail || 'Terjadi kesalahan',
      });
      navigate('/recipients');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RecipientFormData) => {
    try {
      setSubmitting(true);

      // Validate location
      if (data.location.lat === 0 && data.location.lng === 0) {
        toast.error('Lokasi wajib dipilih', {
          description: 'Klik pada peta untuk menandai lokasi penerima',
        });
        return;
      }

      // Prepare data for API
      const payload: RecipientBase = {
        name: data.name.trim(),
        phone: data.phone.trim(),
        address: data.address.trim(),
        province_id: Number(data.province_id),
        city_id: Number(data.city_id),
        location: data.location,
        num_packages: Number(data.num_packages),
      };

      if (isEditMode && id) {
        await recipientService.update(id, payload);
        toast.success('Penerima berhasil diperbarui');
      } else {
        await recipientService.create(payload);
        toast.success('Penerima berhasil ditambahkan');
      }

      navigate('/recipients');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Terjadi kesalahan';
      
      // Check for specific errors
      if (errorMessage.toLowerCase().includes('already exists') || 
          errorMessage.toLowerCase().includes('sudah ada')) {
        toast.error('Nomor telepon sudah terdaftar', {
          description: 'Silakan gunakan nomor telepon yang lain',
        });
      } else {
        toast.error(
          isEditMode ? 'Gagal memperbarui penerima' : 'Gagal menambahkan penerima',
          { description: errorMessage }
        );
      }
    } finally {
      setSubmitting(false);
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
    <div className="p-6 w-full min-w-0">
      <div className="mx-auto max-w-4xl w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/recipients')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Edit Penerima' : 'Tambah Penerima'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? 'Perbarui data penerima' : 'Tambah penerima baru'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Penerima</CardTitle>
            <CardDescription>Data pribadi penerima paket sembako</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="required">
                Nama Lengkap
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Contoh: Ahmad Ridwan"
                {...register('name', {
                  required: 'Nama wajib diisi',
                  minLength: { value: 2, message: 'Nama minimal 2 karakter' },
                  maxLength: { value: 100, message: 'Nama maksimal 100 karakter' },
                })}
                className={errors.name ? 'border-destructive' : ''}
                maxLength={100}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="required">
                Nomor Telepon
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Contoh: 081234567890"
                {...register('phone', {
                  required: 'Nomor telepon wajib diisi',
                  pattern: {
                    value: /^[0-9+\-\s()]+$/,
                    message: 'Format nomor telepon tidak valid',
                  },
                  minLength: { value: 9, message: 'Nomor telepon minimal 9 digit' },
                  maxLength: { value: 20, message: 'Nomor telepon maksimal 20 karakter' },
                })}
                className={errors.phone ? 'border-destructive' : ''}
                maxLength={20}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Format: 08123456789 atau +628123456789
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Address and Location - Unified Section */}
        <Card>
          <CardHeader>
            <CardTitle>Alamat dan Lokasi</CardTitle>
            <CardDescription>Informasi alamat dan lokasi pengiriman pada peta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Province */}
            <div className="space-y-2">
              <Label htmlFor="province_id" className="required">
                Provinsi
              </Label>
              <Controller
                name="province_id"
                control={control}
                rules={{ required: 'Provinsi wajib dipilih' }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.province_id ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Pilih provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id.toString()}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.province_id && (
                <p className="text-sm text-destructive">{errors.province_id.message}</p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city_id" className="required">
                Kabupaten/Kota
              </Label>
              <Controller
                name="city_id"
                control={control}
                rules={{ required: 'Kab/Kota wajib dipilih' }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!provinceId}>
                    <SelectTrigger className={errors.city_id ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Pilih kab/kota" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.city_id && (
                <p className="text-sm text-destructive">{errors.city_id.message}</p>
              )}
              {!provinceId && (
                <p className="text-sm text-muted-foreground">Pilih provinsi terlebih dahulu</p>
              )}
            </div>

            {/* Address Input with Autocomplete and Map */}
            <Controller
              name="location"
              control={control}
              rules={{
                validate: (value) =>
                  (value.lat !== 0 && value.lng !== 0) || 'Lokasi pada peta wajib dipilih',
              }}
              render={({ field: locationField }) => (
                <Controller
                  name="address"
                  control={control}
                  rules={{
                    required: 'Alamat wajib diisi',
                    minLength: { value: 10, message: 'Alamat minimal 10 karakter' },
                    maxLength: { value: 500, message: 'Alamat maksimal 500 karakter' },
                  }}
                  render={({ field: addressField }) => (
                    <LocationPicker
                      value={locationField.value}
                      onChange={locationField.onChange}
                      address={addressField.value}
                      onAddressChange={addressField.onChange}
                      error={errors.location?.message || errors.address?.message}
                    />
                  )}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Delivery Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Pengiriman</CardTitle>
            <CardDescription>Informasi jumlah paket yang akan dikirim</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="num_packages" className="required">
                Jumlah Paket
              </Label>
              <Input
                id="num_packages"
                type="number"
                min="1"
                max="999"
                placeholder="1"
                {...register('num_packages', {
                  required: 'Jumlah paket wajib diisi',
                  min: { value: 1, message: 'Jumlah paket minimal 1' },
                  max: { value: 999, message: 'Jumlah paket maksimal 999' },
                })}
                className={errors.num_packages ? 'border-destructive' : ''}
              />
              {errors.num_packages && (
                <p className="text-sm text-destructive">{errors.num_packages.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/recipients')}
            disabled={submitting}
          >
            Batal
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? 'Menyimpan...'
              : isEditMode
              ? 'Simpan Perubahan'
              : 'Tambah Penerima'}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
}
