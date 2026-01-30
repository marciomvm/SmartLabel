# 🔧 Correções Aplicadas - Niimbot B1 QR Code Printing

## 📋 Resumo do Problema

A impressora Niimbot B1 estava imprimindo apenas **15-20% do QR code**, cortando a maior parte da imagem.

## 🔍 Causas Identificadas

### 1. **Largura da Imagem Incorreta**
- **Problema**: Labels geradas com 320px de largura
- **Esperado**: Niimbot B1 tem largura nativa de 384 pixels
- **Impacto**: QR code ficava desalinhado e cortado

### 2. **Formato de Contagem de Pixels Errado**
- **Problema**: Enviando contagem real de pixels pretos em formato little-endian
- **Esperado**: Impressora B1 espera sempre zeros (0x00, 0x00, 0x00)
- **Impacto**: Dados interpretados incorretamente pela impressora

### 3. **Ordem dos Parâmetros Invertida**
- **Problema**: Comando SET_DIMENSION enviando (height, width, 1)
- **Esperado**: Deve ser (width, height) sem terceiro parâmetro
- **Impacto**: Impressora confusa sobre dimensões reais da imagem

## ✅ Correções Implementadas

### Arquivo: `label_generator.py`

#### Mudança 1: Dimensões da Label
```python
# ANTES
W, H = 320, 240  # ❌ Largura incorreta

# DEPOIS
W, H = 384, 240  # ✅ Largura nativa da B1
```

#### Mudança 2: Tamanho do QR Code
```python
# ANTES
qr_size = 180
text_x = 200

# DEPOIS
qr_size = 200  # ✅ QR code maior para melhor leitura
text_x = 220   # ✅ Ajustado para nova largura
```

### Arquivo: `printer.py`

#### Mudança 3: Função de Contagem de Pixels
```python
# ANTES
def count_pixels_b1(total_count: int):
    return struct.pack('<H', total_count) + b'\x00'

# DEPOIS
def count_pixels_b1(total_count: int):
    # B1 protocol: Always send zeros (verified from NiimPrintX)
    return b'\x00\x00\x00'
```

#### Mudança 4: Ordem do SET_DIMENSION
```python
# ANTES
await send_packet(client, make_packet(0x13, struct.pack('>HHH', height, width, 1)), 0.1)

# DEPOIS
# SET_DIMENSION: width first, then height (corrected order)
await send_packet(client, make_packet(0x13, struct.pack('>HH', width, height)), 0.1)
```

#### Mudança 5: Header das Linhas
```python
# ANTES
header = struct.pack('>H', i) + count_pixels_b1(black_count) + b'\x01'

# DEPOIS
# Header format: [Row Number (2 bytes BE)] + [0,0,0] + [Repeat=1]
header = struct.pack('>H', i) + b'\x00\x00\x00' + b'\x01'
```

#### Mudança 6: Velocidade de Transmissão
```python
# ANTES
await asyncio.sleep(0.03)  # 30ms por linha

# DEPOIS
await asyncio.sleep(0.01)  # 10ms por linha (3x mais rápido)
```

## 📊 Comparação de Pacotes

### Pacote SET_DIMENSION (0x13)
```
❌ Antes: 00 F0 01 80 00 01  (height=240, width=384, extra=1)
✅ Depois: 01 80 00 F0        (width=384, height=240)
```

### Header de Linha (exemplo: linha 100)
```
❌ Antes: 00 64 96 00 00 01  (row + pixel_count + repeat)
✅ Depois: 00 64 00 00 00 01  (row + zeros + repeat)
```

## 🧪 Como Testar

### 1. Gerar Label de Teste
```bash
cd print-service
python label_generator.py
```

### 2. Verificar Dimensões
```bash
python -c "from PIL import Image; img = Image.open('label_G-20260129-01.png'); print(f'Dimensions: {img.size}')"
```
**Esperado**: `Dimensions: (384, 240)`

### 3. Executar Teste Completo
```bash
python test_corrections.py
```

### 4. Imprimir na B1
```bash
python printer.py label_G-20260130-TEST.png
```

## 📝 Checklist de Validação

- [x] Label gerada com 384px de largura
- [x] QR code maior (200x200px)
- [x] Contagem de pixels sempre zeros
- [x] SET_DIMENSION com ordem correta (width, height)
- [x] Headers de linha simplificados
- [x] Velocidade otimizada (10ms/linha)
- [ ] **Teste real na impressora B1** ⬅️ PRÓXIMO PASSO

## 🎯 Resultado Esperado

Após estas correções, a impressora Niimbot B1 deve:
- ✅ Imprimir o QR code **completo** (100%)
- ✅ Manter proporções corretas
- ✅ Imprimir mais rápido (3x)
- ✅ Texto alinhado corretamente

## 📚 Referências

As correções foram baseadas na análise do código do **NiimPrintX**, que é uma implementação funcional do protocolo Niimbot:
- Repositório: `NiimPrintX/NiimPrintX/nimmy/printer.py`
- Método `_encode_image()` - linha 147
- Método `set_dimension()` - linha 237

## 🚀 Próximos Passos

1. **Teste na impressora real**: Execute `python printer.py label_G-20260130-TEST.png`
2. **Verifique o QR code**: Use um leitor de QR code para confirmar que está legível
3. **Integre com o app**: Se funcionar, o endpoint `/print-label` já está usando o código corrigido
4. **Ajuste fino**: Se necessário, ajuste densidade (comando 0x21) ou tamanho do QR code

## ⚠️ Notas Importantes

- As mudanças são **retrocompatíveis** com o resto do sistema
- O arquivo `app.py` não precisa de alterações
- Labels antigas (320px) serão automaticamente centralizadas em 384px
- A função `process_image()` adiciona padding branco se necessário

---

**Data das Correções**: 30/01/2026  
**Versão**: 1.0  
**Status**: ✅ Pronto para teste
