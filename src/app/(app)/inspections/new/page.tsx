
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Upload, X, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { addInspection, fetchAuditors, fetchAreas, fetchRiskTypes } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { PotentialLevels, StatusLevels, inspectionSchema, type Auditor, type Area, type RiskType } from '@/lib/types';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE_MB = 2;
const COMPRESSION_QUALITY = 0.7;
const MAX_DIMENSION = 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function NewInspectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [riskTypes, setRiskTypes] = useState<RiskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof inspectionSchema>>({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      auditor: '',
      area: '',
      riskType: '',
      description: '',
      correctiveAction: '',
      responsible: '',
      potential: 'Médio',
      status: 'Em Andamento',
      date: new Date().toISOString(),
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 7 days from now
      photos: [],
    },
  });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [auditorsData, areasData, riskTypesData] = await Promise.all([
          fetchAuditors(),
          fetchAreas(),
          fetchRiskTypes(),
        ]);
        setAuditors(auditorsData);
        setAreas(areasData);
        setRiskTypes(riskTypesData);
      } catch (error) {
        const errorMessage = 'Não foi possível carregar os dados necessários para o formulário.';
        setLoadError(errorMessage);
        toast({
          title: 'Erro ao carregar dados',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);

  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Apenas arquivos de imagem (JPEG, PNG, WebP) são aceitos.';
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `O arquivo excede o tamanho máximo de ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  };

  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            }
          } else if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL(file.type, COMPRESSION_QUALITY));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  }, []);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    // Check total photo limit
    if (photoPreviews.length + files.length > MAX_PHOTOS) {
      toast({
        title: 'Limite de fotos excedido',
        description: `Você pode enviar no máximo ${MAX_PHOTOS} fotos.`,
        variant: 'destructive',
      });
      return;
    }

    const newPreviews: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Validate file
      const validationError = validateImageFile(file);
      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        continue;
      }

      try {
        const compressedDataUrl = await compressImage(file);
        newPreviews.push(compressedDataUrl);
      } catch (error) {
        errors.push(`${file.name}: Falha ao processar imagem`);
      }
    }

    // Show errors if any
    if (errors.length > 0) {
      toast({
        title: 'Erro ao processar algumas imagens',
        description: errors.join(', '),
        variant: 'destructive',
      });
    }

    // Add successfully processed images
    if (newPreviews.length > 0) {
      setPhotoPreviews((prev) => [...prev, ...newPreviews]);
    }

    // Clear the input
    event.target.value = '';
  };

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const onSubmit = async (values: z.infer<typeof inspectionSchema>) => {
    try {
      // Add photos to form data
      values.photos = photoPreviews;
      
      const result = await addInspection(values);
      
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: result.message || 'Inspeção registrada com sucesso!',
        });
        router.push('/inspections');
      } else {
        throw new Error(result.message || 'Falha ao adicionar inspeção');
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao adicionar inspeção.',
        variant: 'destructive',
      });
    }
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nova Inspeção de Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nova Inspeção de Segurança</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {loadError} Tente recarregar a página.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="mt-4"
          >
            Recarregar Página
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Nova Inspeção de Segurança</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="auditor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auditor</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um auditor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {auditors.length === 0 ? (
                          <SelectItem value="" disabled>
                            Nenhum auditor disponível
                          </SelectItem>
                        ) : (
                          auditors.map((auditor) => (
                            <SelectItem key={auditor.id} value={auditor.name}>
                              {auditor.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data da Inspeção</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP', { locale: ptBR })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma área" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {areas.length === 0 ? (
                          <SelectItem value="" disabled>
                            Nenhuma área disponível
                          </SelectItem>
                        ) : (
                          areas.map((area) => (
                            <SelectItem key={area.id} value={area.name}>
                              {area.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="riskType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Situação de Risco</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tipo de risco" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <ScrollArea className="h-72">
                          {riskTypes.length === 0 ? (
                            <SelectItem value="" disabled>
                              Nenhum tipo de risco disponível
                            </SelectItem>
                          ) : (
                            riskTypes.map((riskType) => (
                              <SelectItem key={riskType.id} value={riskType.name}>
                                {riskType.name}
                              </SelectItem>
                            ))
                          )}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="potential"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Potencial</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o nível de potencial" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PotentialLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 lg:col-span-3"></div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel>Descrição da Situação Encontrada</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva a situação em detalhes..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="correctiveAction"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel>Ação Corretiva</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva a ação corretiva necessária ou tomada..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável pela Ação Corretiva</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Prazo Final</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP', { locale: ptBR })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          disabled={(date) => new Date(date) < new Date(new Date().setHours(0,0,0,0))}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status da Ação Corretiva</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {StatusLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2 lg:col-span-3">
                <FormLabel>
                  Fotos (até {MAX_PHOTOS}) 
                  <span className="text-sm text-muted-foreground ml-2">
                    {photoPreviews.length}/{MAX_PHOTOS}
                  </span>
                </FormLabel>
                <div className="mt-2 flex items-center justify-center w-full">
                  <label 
                    htmlFor="dropzone-file" 
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-background transition-colors",
                      photoPreviews.length >= MAX_PHOTOS && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WebP (MAX. {MAX_FILE_SIZE_MB}MB por foto)
                      </p>
                    </div>
                    <input 
                      id="dropzone-file" 
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept={ACCEPTED_IMAGE_TYPES.join(',')} 
                      onChange={handlePhotoChange} 
                      disabled={photoPreviews.length >= MAX_PHOTOS} 
                    />
                  </label>
                </div>
                
                {photoPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {photoPreviews.map((src, index) => (
                      <div key={index} className="relative group">
                        <Image 
                          src={src} 
                          alt={`Preview ${index + 1}`} 
                          width={150} 
                          height={150} 
                          className="rounded-md object-cover w-full aspect-square border" 
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemovePhoto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={form.formState.isSubmitting}
                className="min-w-[150px]"
              >
                {form.formState.isSubmitting ? 'Enviando...' : 'Registrar Inspeção'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    