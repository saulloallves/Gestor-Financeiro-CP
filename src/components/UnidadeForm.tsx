import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Autocomplete,
  InputAdornment,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "@mui/material/styles";
import {
  Save,
  X,
  Building2,
  User,
  MapPin,
  Clock,
  Search,
  Info,
  Users,
  Link,
} from "lucide-react";
import {
  useCreateUnidade,
  useUpdateUnidade,
  useFranqueados,
  useFranqueadosVinculados,
} from "../hooks/useUnidades";
import {
  validarCnpj,
  formatarCnpj,
  formatarTelefone,
  validarTelefone,
  formatarCpf,
} from "../utils/validations";
import { buscarCep } from "../api/viaCepService";
import { CodigoUnidade } from "./CodigoUnidade";
import type { Unidade, FranqueadoPrincipal } from "../types/unidades";

// Interface personalizada para as abas
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`unidade-tabpanel-${index}`}
      aria-labelledby={`unidade-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `unidade-tab-${index}`,
    "aria-controls": `unidade-tabpanel-${index}`,
  };
}

// Schema de validação com Zod
const unidadeSchema = z.object({
  nome_grupo: z.string().optional(),
  nome_padrao: z.string().min(1, "Nome da unidade é obrigatório"),
  cnpj: z
    .string()
    .optional()
    .refine(
      (cnpj) => {
        if (!cnpj || cnpj.trim() === "") return true; // Campo opcional
        return validarCnpj(cnpj);
      },
      {
        message: "CNPJ inválido",
      }
    ),

  // Contato
  telefone_comercial: z
    .string()
    .optional()
    .refine(
      (telefone) => {
        if (!telefone || telefone.trim() === "") return true;
        return validarTelefone(telefone);
      },
      {
        message: "Telefone inválido",
      }
    ),
  email_comercial: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  instagram: z.string().optional(),

  // Endereço
  endereco_rua: z.string().optional(),
  endereco_numero: z.string().optional(),
  endereco_complemento: z.string().optional(),
  endereco_bairro: z.string().optional(),
  endereco_cidade: z.string().optional(),
  endereco_estado: z.string().optional(),
  endereco_uf: z.string().optional(),
  endereco_cep: z.string().optional(),

  // Horários
  horario_seg_sex: z.string().optional(),
  horario_sabado: z.string().optional(),
  horario_domingo: z.string().optional(),

  // Configurações
  status: z.enum(["ativo", "em_implantacao", "suspenso", "cancelado"] as const),
  multifranqueado: z.boolean(),
  franqueado_principal_id: z.string().optional(),
});

type UnidadeFormData = z.infer<typeof unidadeSchema>;

interface UnidadeFormProps {
  unidade?: Unidade;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UnidadeForm({
  unidade,
  onSuccess,
  onCancel,
}: UnidadeFormProps) {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [codigoUnidade, setCodigoUnidade] = useState("");
  const [selectedFranqueado, setSelectedFranqueado] =
    useState<FranqueadoPrincipal | null>(null);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const isEditing = !!unidade;

  // Hooks para queries
  const { data: franqueados = [], isLoading: franqueadosLoading } =
    useFranqueados();
  const { data: franqueadosVinculados = [], isLoading: vinculosLoading } =
    useFranqueadosVinculados(unidade?.id || "");

  // Mutations
  const createMutation = useCreateUnidade();
  const updateMutation = useUpdateUnidade();

  // Configuração do formulário
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UnidadeFormData>({
    resolver: zodResolver(unidadeSchema),
    defaultValues: {
      nome_grupo: "",
      nome_padrao: "",
      cnpj: "",
      telefone_comercial: "",
      email_comercial: "",
      instagram: "",
      endereco_rua: "",
      endereco_numero: "",
      endereco_complemento: "",
      endereco_bairro: "",
      endereco_cidade: "",
      endereco_estado: "",
      endereco_uf: "",
      endereco_cep: "",
      horario_seg_sex: "",
      horario_sabado: "",
      horario_domingo: "",
      status: "ativo",
      multifranqueado: false,
      franqueado_principal_id: undefined,
    },
  });

  // Watch para valores que afetam a UI
  const multifranqueado = watch("multifranqueado");

  // Função para buscar CEP
  const handleBuscarCep = async (cep: string) => {
    if (!cep || cep.length < 8) return;

    setBuscandoCep(true);
    try {
      const endereco = await buscarCep(cep);
      if (endereco) {
        setValue("endereco_rua", endereco.logradouro);
        setValue("endereco_bairro", endereco.bairro);
        setValue("endereco_cidade", endereco.cidade);
        setValue("endereco_estado", endereco.estado);
        setValue("endereco_uf", endereco.uf);
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setBuscandoCep(false);
    }
  };

  // Inicializar formulário com dados da unidade (edição)
  useEffect(() => {
    if (unidade) {
      reset({
        nome_grupo: unidade.nome_grupo || "",
        nome_padrao: unidade.nome_padrao,
        cnpj: unidade.cnpj || "",
        telefone_comercial: unidade.telefone_comercial || "",
        email_comercial: unidade.email_comercial || "",
        instagram: unidade.instagram || "",
        endereco_rua: unidade.endereco_rua || "",
        endereco_numero: unidade.endereco_numero || "",
        endereco_complemento: unidade.endereco_complemento || "",
        endereco_bairro: unidade.endereco_bairro || "",
        endereco_cidade: unidade.endereco_cidade || "",
        endereco_estado: unidade.endereco_estado || "",
        endereco_uf: unidade.endereco_uf || "",
        endereco_cep: unidade.endereco_cep || "",
        horario_seg_sex: unidade.horario_seg_sex || "",
        horario_sabado: unidade.horario_sabado || "",
        horario_domingo: unidade.horario_domingo || "",
        status: unidade.status,
        multifranqueado: unidade.multifranqueado,
        franqueado_principal_id: unidade.franqueado_principal_id || undefined,
      });

      // Encontrar e selecionar o franqueado principal
      if (unidade.franqueado_principal_id && franqueados.length > 0) {
        const franqueado = franqueados.find(
          (f) => f.id === unidade.franqueado_principal_id
        );
        if (franqueado) {
          setSelectedFranqueado(franqueado);
        }
      }

      setCodigoUnidade(unidade.codigo_unidade);
    }
  }, [unidade, franqueados, reset]);

  // Submissão do formulário
  const onSubmit = async (data: UnidadeFormData) => {
    try {
      const formData = {
        ...data,
        email_comercial: data.email_comercial || undefined,
        franqueado_principal_id: data.franqueado_principal_id || undefined,
        ...(codigoUnidade && { codigo_unidade: codigoUnidade }),
      };

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: unidade.id,
          ...formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }

      onSuccess();
    } catch (error) {
      console.error("Erro no formulário:", error);
    }
  };

  // Handler para mudança de aba
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Função para obter a cor do status
  const getStatusColor = (
    status: string
  ): "default" | "success" | "warning" | "error" => {
    switch (status) {
      case "ativo":
        return "success";
      case "em_implantacao":
        return "warning";
      case "suspenso":
        return "error";
      case "cancelado":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Card sx={{ maxWidth: 1200, margin: "auto" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Building2 color={theme.palette.primary.main} />
            <Typography variant="h5" component="h1">
              {isEditing ? "Editar Unidade" : "Nova Unidade"}
            </Typography>
          </Box>
        }
        action={
          <Button
            variant="outlined"
            startIcon={<X />}
            onClick={onCancel}
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
        }
      />

      <CardContent>
        {/* Exibir código da unidade se estiver editando */}
        {isEditing && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Código da Unidade:</strong> {unidade?.codigo_unidade}
            </Typography>
          </Alert>
        )}

        {/* Tabs de Navegação */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Abas do formulário de unidade"
          >
            <Tab
              icon={<Info size={16} />}
              label="Informações Básicas"
              {...a11yProps(0)}
            />
            <Tab
              icon={<MapPin size={16} />}
              label="Endereço"
              {...a11yProps(1)}
            />
            <Tab
              icon={<Clock size={16} />}
              label="Horários"
              {...a11yProps(2)}
            />
            <Tab
              icon={<User size={16} />}
              label="Franqueado Principal"
              {...a11yProps(3)}
            />
            {isEditing && (
              <Tab
                icon={<Users size={16} />}
                label="Vínculos"
                {...a11yProps(4)}
              />
            )}
          </Tabs>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Tab 1: Informações Básicas */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Componente para geração/exibição do código da unidade */}
              <CodigoUnidade
                codigo={codigoUnidade}
                isEditing={isEditing}
                onCodigoChange={setCodigoUnidade}
                disabled={isSubmitting}
              />

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                }}
              >
                <Controller
                  name="nome_padrao"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nome da Unidade"
                      required
                      error={!!errors.nome_padrao}
                      helperText={errors.nome_padrao?.message}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="nome_grupo"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Nome do Grupo/Franqueado Principal"
                      error={!!errors.nome_grupo}
                      helperText={errors.nome_grupo?.message}
                      fullWidth
                    />
                  )}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                }}
              >
                <Controller
                  name="cnpj"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="CNPJ"
                      error={!!errors.cnpj}
                      helperText={errors.cnpj?.message}
                      fullWidth
                      onChange={(e) => {
                        const cnpjFormatado = formatarCnpj(e.target.value);
                        field.onChange(cnpjFormatado);
                      }}
                    />
                  )}
                />
                <Controller
                  name="telefone_comercial"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Telefone Comercial"
                      error={!!errors.telefone_comercial}
                      helperText={errors.telefone_comercial?.message}
                      fullWidth
                      onChange={(e) => {
                        const telefoneFormatado = formatarTelefone(
                          e.target.value
                        );
                        field.onChange(telefoneFormatado);
                      }}
                    />
                  )}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                }}
              >
                <Controller
                  name="email_comercial"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Email Comercial"
                      type="email"
                      error={!!errors.email_comercial}
                      helperText={errors.email_comercial?.message}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="instagram"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Instagram"
                      error={!!errors.instagram}
                      helperText={errors.instagram?.message}
                      fullWidth
                      placeholder="@usuario_instagram"
                    />
                  )}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                }}
              >
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Status"
                      select
                      required
                      error={!!errors.status}
                      helperText={errors.status?.message}
                      fullWidth
                    >
                      <MenuItem value="ativo">Ativo</MenuItem>
                      <MenuItem value="em_implantacao">Em Implantação</MenuItem>
                      <MenuItem value="suspenso">Suspenso</MenuItem>
                      <MenuItem value="cancelado">Cancelado</MenuItem>
                    </TextField>
                  )}
                />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    minWidth: { md: "50%" },
                  }}
                >
                  <Controller
                    name="multifranqueado"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        }
                        label="Unidade Multifranqueado"
                      />
                    )}
                  />
                </Box>
              </Box>
            </Box>
          </TabPanel>

          {/* Tab 2: Endereço */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                }}
              >
                <Controller
                  name="endereco_cep"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="CEP"
                      error={!!errors.endereco_cep}
                      helperText={errors.endereco_cep?.message}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {buscandoCep ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Button
                                onClick={() =>
                                  handleBuscarCep(field.value || "")
                                }
                                startIcon={<Search />}
                                size="small"
                              >
                                Buscar
                              </Button>
                            )}
                          </InputAdornment>
                        ),
                      }}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        if (e.target.value.length === 9) {
                          handleBuscarCep(e.target.value);
                        }
                      }}
                    />
                  )}
                />
                <Controller
                  name="endereco_rua"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Rua/Logradouro"
                      error={!!errors.endereco_rua}
                      helperText={errors.endereco_rua?.message}
                      fullWidth
                    />
                  )}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Controller
                    name="endereco_numero"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Número"
                        error={!!errors.endereco_numero}
                        helperText={errors.endereco_numero?.message}
                        fullWidth
                      />
                    )}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Controller
                    name="endereco_complemento"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Complemento"
                        error={!!errors.endereco_complemento}
                        helperText={errors.endereco_complemento?.message}
                        fullWidth
                      />
                    )}
                  />
                </Box>
                <Box sx={{ flex: 2 }}>
                  <Controller
                    name="endereco_bairro"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Bairro"
                        error={!!errors.endereco_bairro}
                        helperText={errors.endereco_bairro?.message}
                        fullWidth
                      />
                    )}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: 2,
                }}
              >
                <Box sx={{ flex: 3 }}>
                  <Controller
                    name="endereco_cidade"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Cidade"
                        error={!!errors.endereco_cidade}
                        helperText={errors.endereco_cidade?.message}
                        fullWidth
                      />
                    )}
                  />
                </Box>
                <Box sx={{ flex: 2 }}>
                  <Controller
                    name="endereco_estado"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Estado"
                        error={!!errors.endereco_estado}
                        helperText={errors.endereco_estado?.message}
                        fullWidth
                      />
                    )}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Controller
                    name="endereco_uf"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="UF"
                        error={!!errors.endereco_uf}
                        helperText={errors.endereco_uf?.message}
                        fullWidth
                        inputProps={{ maxLength: 2 }}
                      />
                    )}
                  />
                </Box>
              </Box>
            </Box>
          </TabPanel>

          {/* Tab 3: Horários */}
          <TabPanel value={tabValue} index={2}>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 2,
              }}
            >
              <Controller
                name="horario_seg_sex"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Segunda a Sexta"
                    error={!!errors.horario_seg_sex}
                    helperText={errors.horario_seg_sex?.message}
                    fullWidth
                    placeholder="08:00 - 18:00"
                  />
                )}
              />
              <Controller
                name="horario_sabado"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Sábado"
                    error={!!errors.horario_sabado}
                    helperText={errors.horario_sabado?.message}
                    fullWidth
                    placeholder="08:00 - 12:00"
                  />
                )}
              />
              <Controller
                name="horario_domingo"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Domingo"
                    error={!!errors.horario_domingo}
                    helperText={errors.horario_domingo?.message}
                    fullWidth
                    placeholder="Fechado ou 09:00 - 15:00"
                  />
                )}
              />
            </Box>
          </TabPanel>

          {/* Tab 4: Franqueado Principal */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {!multifranqueado && (
                <Alert severity="info">
                  Selecione o franqueado principal responsável por esta unidade.
                </Alert>
              )}
              {multifranqueado && (
                <Alert severity="warning">
                  Esta unidade está marcada como multifranqueado. Você pode
                  definir um franqueado principal, mas ele não será o único
                  responsável.
                </Alert>
              )}

              <Controller
                name="franqueado_principal_id"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    options={franqueados}
                    getOptionLabel={(option) =>
                      `${option.nome} - ${formatarCpf(option.cpf || "")}`
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Franqueado Principal"
                        error={!!errors.franqueado_principal_id}
                        helperText={errors.franqueado_principal_id?.message}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <User size={20} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                    value={selectedFranqueado}
                    onChange={(_, newValue) => {
                      setSelectedFranqueado(newValue);
                      field.onChange(newValue?.id || "");
                    }}
                    loading={franqueadosLoading}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value?.id
                    }
                  />
                )}
              />

              {selectedFranqueado && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Informações do Franqueado Selecionado
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", md: "row" },
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Nome
                          </Typography>
                          <Typography variant="body1">
                            {selectedFranqueado.nome}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            CPF
                          </Typography>
                          <Typography variant="body1">
                            {formatarCpf(selectedFranqueado.cpf || "")}
                          </Typography>
                        </Box>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: { xs: "column", md: "row" },
                          gap: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1">
                            {selectedFranqueado.email || "Não informado"}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Telefone
                          </Typography>
                          <Typography variant="body1">
                            {selectedFranqueado.telefone || "Não informado"}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Box>
          </TabPanel>

          {/* Tab 5: Vínculos (só aparece quando editando) */}
          {isEditing && (
            <TabPanel value={tabValue} index={4}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Link size={20} />
                    Franqueados Vinculados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lista de todos os franqueados que possuem vínculo ativo com
                    esta unidade.
                  </Typography>
                </Box>

                <Box>
                  {vinculosLoading ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : franqueadosVinculados.length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Nome</TableCell>
                            <TableCell>CPF</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Data do Vínculo</TableCell>
                            <TableCell>Contato</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {franqueadosVinculados.map((vinculo) => (
                            <TableRow key={vinculo.id}>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <User size={16} />
                                  {vinculo.franqueado.nome}
                                </Box>
                              </TableCell>
                              <TableCell>
                                {formatarCpf(vinculo.franqueado.cpf || "")}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={vinculo.franqueado.tipo}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={vinculo.franqueado.status}
                                  size="small"
                                  color={getStatusColor(
                                    vinculo.franqueado.status
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                {new Date(
                                  vinculo.data_vinculo
                                ).toLocaleDateString("pt-BR")}
                              </TableCell>
                              <TableCell>
                                <Box>
                                  {vinculo.franqueado.email && (
                                    <Typography variant="body2">
                                      {vinculo.franqueado.email}
                                    </Typography>
                                  )}
                                  {vinculo.franqueado.telefone && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      {vinculo.franqueado.telefone}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">
                      Nenhum franqueado vinculado a esta unidade no momento.
                    </Alert>
                  )}
                </Box>
              </Box>
            </TabPanel>
          )}

          {/* Botões de ação */}
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}
          >
            <Button
              type="button"
              variant="outlined"
              startIcon={<X />}
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={isSubmitting}
              sx={{
                minWidth: 140,
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : isEditing ? (
                "Atualizar"
              ) : (
                "Salvar"
              )}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
}
