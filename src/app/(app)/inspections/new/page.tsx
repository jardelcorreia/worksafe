
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Upload, X } from 'lucide-react';
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
import { addInspection, fetchAuditors, fetchAreas, fetchRiskTypes } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { PotentialLevels, StatusLevels, inspectionSchema, type Auditor, type Area, type RiskType } from '@/lib/types';


const MAX_PHOTOS = 5;
const MAX_FILE_SIZE_MB = 2;
const COMPRESSION_QUALITY = 0.7;
const MAX_DIMENSION = 1024;

export default function NewInspectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [riskTypes, setRiskTypes] = useState<RiskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
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
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os dados necessários para o formulário.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [toast]);

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
      deadline: new Date().toISOString(),
      photos: [],
    },
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

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
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL(file.type, COMPRESSION_QUALITY));
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    if (photoPreviews.length + files.length > MAX_PHOTOS) {
      toast({
        title: 'Limite de fotos excedido',
        description: `Você pode enviar no máximo ${MAX_PHOTOS} fotos.`,
        variant: 'destructive',
      });
      return;
    }

    const newPreviews: string[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast({
              title: 'Arquivo muito grande',
              description: `O arquivo ${file.name} excede o tamanho máximo de ${MAX_FILE_SIZE_MB}MB.`,
              variant: 'destructive',
          });
          continue;
      }
      try {
        const compressedDataUrl = await compressImage(file);
        newPreviews.push(compressedDataUrl);
      } catch (error) {
        toast({
          title: 'Erro ao processar imagem',
          description: `Falha ao processar o arquivo ${file.name}.`,
          variant: 'destructive',
        });
      }
    }
    
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };


  async function onSubmit(values: z.infer<typeof inspectionSchema>) {
    values.photos = photoPreviews;
    const result = await addInspection(values);
    if (result.success) {
      toast({
        title: 'Sucesso',
        description: result.message,
      });
      router.push('/inspections');
    } else {
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar inspeção.',
        variant: 'destructive',
      });
    }
  }

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Registrar Nova Inspeção de Segurança</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Carregando dados do formulário...</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Nova Inspeção de Segurança</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                        {auditors.map((auditor) => (
                          <SelectItem key={auditor.id} value={auditor.name}>
                            {auditor.name}
                          </SelectItem>
                        ))}
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
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
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
                          selected={new Date(field.value)}
                          onSelect={(date) => field.onChange(date?.toISOString())}
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
                        {areas.map((area) => (
                           <SelectItem key={area.id} value={area.name}>{area.name}</SelectItem>
                        ))}
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
                        {riskTypes.map((riskType) => (
                           <SelectItem key={riskType.id} value={riskType.name}>{riskType.name}</SelectItem>
                        ))}
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
                           <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="lg:col-span-3">
                    <FormLabel>Descrição da Situação Encontrada</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva a situação em detalhes..."
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
                  <FormItem className="lg:col-span-3">
                    <FormLabel>Ação Corretiva</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva a ação corretiva tomada..."
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
                      <Input placeholder="Ex: Equipe de Manutenção" {...field} />
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
                            variant={'outline'}
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
                          selected={new Date(field.value)}
                          onSelect={(date) => field.onChange(date?.toISOString())}
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
                           <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="lg:col-span-3">
                <FormLabel>Fotos (até {MAX_PHOTOS})</FormLabel>
                <FormControl>
                    <div className="mt-2 flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-background">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                                <p className="text-xs text-muted-foreground">PNG, JPG ou GIF (MAX. {MAX_FILE_SIZE_MB}MB por foto)</p>
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" multiple accept="image/*" onChange={handlePhotoChange} disabled={photoPreviews.length >= MAX_PHOTOS} />
                        </label>
                    </div>
                </FormControl>
                {photoPreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {photoPreviews.map((src, index) => (
                            <div key={index} className="relative group">
                                <Image src={src} alt={`Preview ${index + 1}`} width={150} height={150} className="rounded-md object-cover w-full aspect-square" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                                    onClick={() => handleRemovePhoto(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
                 <FormMessage />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
                {form.formState.isSubmitting ? 'Enviando...' : 'Enviar Inspeção'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
