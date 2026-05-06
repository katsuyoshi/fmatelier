"""
PlatformIO pre-build script: Patch framework files to enable USB MIDI.

Patches two files in the Arduino Renesas framework:
  1. tusb_config.h - Enable CFG_TUD_MIDI and add FIFO buffer sizes
  2. USB.cpp - Add MIDI descriptor to composite USB device

The patches are idempotent (safe to run multiple times) using a sentinel comment.
If the framework is updated, patches are automatically re-applied on next build.
"""

Import("env")
import os
import sys

SENTINEL = "/* PATCHED: USB MIDI enabled */"

fw_dir = env.PioPlatform().get_package_dir("framework-arduinorenesas-uno")
tusb_config_path = os.path.join(fw_dir, "variants", "MINIMA", "tusb_config.h")
usb_cpp_path = os.path.join(fw_dir, "cores", "arduino", "usb", "USB.cpp")


def patch_tusb_config():
    with open(tusb_config_path, "r") as f:
        content = f.read()

    if SENTINEL in content:
        return  # already patched

    # Enable MIDI class
    old = "#define CFG_TUD_MIDI             0"
    new = "#define CFG_TUD_MIDI             1  " + SENTINEL
    if old not in content:
        print("WARNING: Could not find CFG_TUD_MIDI pattern in tusb_config.h", file=sys.stderr)
        return
    content = content.replace(old, new)

    # Add MIDI FIFO buffer sizes before closing #endif
    midi_buf_defs = """
/* MIDI FIFO buffer sizes (added by patch_usb_midi.py) */
#ifndef CFG_TUD_MIDI_RX_BUFSIZE
#define CFG_TUD_MIDI_RX_BUFSIZE  256
#endif
#ifndef CFG_TUD_MIDI_TX_BUFSIZE
#define CFG_TUD_MIDI_TX_BUFSIZE  256
#endif

"""
    content = content.replace(
        "#endif /* TUSB_CONFIG_H_ */",
        midi_buf_defs + "#endif /* TUSB_CONFIG_H_ */"
    )

    with open(tusb_config_path, "w") as f:
        f.write(content)
    print("Patched: " + tusb_config_path)


def patch_usb_cpp():
    with open(usb_cpp_path, "r") as f:
        content = f.read()

    if SENTINEL in content:
        return  # already patched

    # 1. Add MIDI to interface count
    old_itf = "(__USBInstallMSD ? 1 : 0);"
    new_itf = "(__USBInstallMSD ? 1 : 0) + (__USBInstallMIDI ? 2 : 0);  " + SENTINEL
    if old_itf not in content:
        print("WARNING: Could not find interface_count pattern in USB.cpp", file=sys.stderr)
        return
    content = content.replace(old_itf, new_itf, 1)

    # 2. Add MIDI descriptor block after MSD block
    midi_block = """
        /*
         * -----    MIDI
         */

#if CFG_TUD_MIDI
#ifndef USBD_MIDI_EP_OUT
#define USBD_MIDI_EP_OUT (0x05)
#endif
#ifndef USBD_MIDI_EP_IN
#define USBD_MIDI_EP_IN  (0x85)
#endif
#define USBD_MIDI_EP_SIZE (64)

        uint8_t midi_itf = (__USBInstallSerial ? 3 : 0) + (__USBGetHIDReport ? 1 : 0) + (__USBInstallMSD ? 1 : 0);
        uint8_t midi_desc[TUD_MIDI_DESC_LEN] = {
            TUD_MIDI_DESCRIPTOR(midi_itf, 0, USBD_MIDI_EP_OUT, USBD_MIDI_EP_IN, USBD_MIDI_EP_SIZE)
        };
#else
        uint8_t midi_desc[0] = {};
#endif
"""
    anchor_msd_end = "        uint8_t msd_desc[0] = {};\n#endif"
    if anchor_msd_end not in content:
        print("WARNING: Could not find msd_desc anchor in USB.cpp", file=sys.stderr)
        return
    content = content.replace(anchor_msd_end, anchor_msd_end + midi_block, 1)

    # 3. Add MIDI to total descriptor length
    old_len = "(__USBInstallMSD ? sizeof(msd_desc) : 0);"
    new_len = "(__USBInstallMSD ? sizeof(msd_desc) : 0) + (__USBInstallMIDI ? sizeof(midi_desc) : 0);"
    content = content.replace(old_len, new_len, 1)

    # 4. Add MIDI to descriptor assembly (after MSD memcpy block)
    old_msd_block = """            if (__USBInstallMSD) {
                memcpy(ptr, msd_desc, sizeof(msd_desc));
                ptr += sizeof(msd_desc);
            }"""
    new_msd_block = old_msd_block + """
            if (__USBInstallMIDI) {
                memcpy(ptr, midi_desc, sizeof(midi_desc));
                ptr += sizeof(midi_desc);
            }"""
    if old_msd_block not in content:
        print("WARNING: Could not find MSD memcpy block in USB.cpp", file=sys.stderr)
        return
    content = content.replace(old_msd_block, new_msd_block, 1)

    with open(usb_cpp_path, "w") as f:
        f.write(content)
    print("Patched: " + usb_cpp_path)


patch_tusb_config()
patch_usb_cpp()
